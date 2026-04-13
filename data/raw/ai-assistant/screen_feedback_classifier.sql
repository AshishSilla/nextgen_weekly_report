-- ============================================================
-- HackerRank NextGen — Screen Feedback Classifier
-- Trino-Compatible | LIKE-based keyword matching
-- Classification column: any_feedback (raw comments + feedback options combined)
-- ============================================================

-- Fix 1: ever_paid and sf_data lifted from nested CTE to top level
--         (Trino does not support WITH inside a CTE body)
WITH current_paid_customers AS
(
SELECT
  CAST(account.hrid_C as INT) AS company_id,
  account.id AS salesforce_account_id,
  account.name AS salesforce_account_name,
  account.company_size_segment_c AS company_size_segment,
  account.region_c as salesforce_region,
  account.region_hq_c as salesforce_HQ_region,
  account.industry_type_c as industry_type,
  account.super_industry_c as super_industry,
  account.arr_c ,
  CAST(service_start_date_c AS DATE) service_start_date,
  CAST(service_end_date_c AS DATE) service_end_date,
  -- Fix 10: 'Ctomer' typo corrected to 'Customer'
  case when account.type = 'Customer' then 'full_serve' when account.type = 'Subscription' then 'self_serve' end AS company_service_type,
    Coalesce(CONCAT(CONCAT(owner.first_name,' '),owner.last_name) ,'Untagged')  AS account_owner_name,
    owner.email AS account_owner_email,
  account.type AS account_type,
  account.region_c AS region
FROM hudi.salesforce.account AS account
    LEFT JOIN hudi.salesforce.user AS owner ON owner.id = account.owner_id
WHERE account.hrid_C <> ''
AND account.hrid_C <> ' '
AND account.hrid_C IS NOT NULL
AND substr(account.hrid_C, 1, 1) <> 'D'
AND account.type in ('Customer','Subscription')
 ),

  -- ============================================================
  -- STEP 1: Raw screen feedback rows
  -- ============================================================
  raw_screens AS (
      SELECT DISTINCT
          'screen'                                                                AS feedback_source,
          DATE(recruit_test_candidates.attempt_starttime)                         AS attempt_started_date,
          rc.name                                                                 AS company_name,
          CAST(recruit_tests.id AS VARCHAR)                                       AS company_id,
          recruit_tests.id                                                        AS test_id,
          recruit_tests.name                                                      AS test_name,
          attempt_id,
          recruit_test_candidates.email                                           AS candidate_email,
          recruit_test_feedback.product_rating,
          recruit_test_feedback.comments                                          AS raw_feedback_text,
          JSON_EXTRACT_SCALAR(TRY(json_parse(recruit_test_feedback.metadata)), '$.feedback_options')
                                                                                  AS feedback_options_selected,
          -- combined field used for classification
          COALESCE(recruit_test_feedback.comments, '')
              || ' '
              || COALESCE(JSON_EXTRACT_SCALAR(TRY(json_parse(recruit_test_feedback.metadata)),'$.feedback_options'), '') AS any_feedback,
          ever_paid.company_service_type,
          ever_paid.arr_c,
          ever_paid.account_type,
          ever_paid.company_size_segment,
          ever_paid.salesforce_region,
          ever_paid.salesforce_HQ_region,
          ever_paid.industry_type,
          ever_paid.super_industry

      FROM current_paid_customers ever_paid
      INNER JOIN hudi.recruit.recruit_companies rc
          ON ABS(ever_paid.company_id) = rc.id
          AND LOWER(rc.name) NOT IN ('none', ' ', 'hackerra', 'interviewstreet')
          AND LOWER(rc.name) NOT LIKE '%hackerrank%'
          AND LOWER(rc.name) NOT LIKE '%hacker%rank%'
          AND LOWER(rc.name) NOT LIKE '%interviewstreet%'
          AND LOWER(rc.name) NOT LIKE '%interview%street%'
          AND rc.name NOT LIKE 'Company%'
      INNER JOIN recruit.recruit_tests AS recruit_tests
          ON ABS(recruit_tests.company_id) = ABS(ever_paid.company_id)
      INNER JOIN recruit.recruit_test_candidates AS recruit_test_candidates
          ON recruit_tests.id = recruit_test_candidates.test_id
          AND recruit_test_candidates.attempt_starttime
                BETWEEN TIMESTAMP '{{start_date}}' AND TIMESTAMP '{{end_date}}'
          AND recruit_tests.state <> 3
          AND recruit_test_candidates.valid = 1
          -- Fix 1: missing comma in COALESCE call
          AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%@hackerrank.com'
          AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%@hackerrank.net'
          AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%sandbox17e2d93e4afe44ea889d89aadf6d413f.mailgun.org'
          AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%@strongqa.com'
      INNER JOIN recruit.recruit_test_feedback AS recruit_test_feedback
          ON recruit_test_feedback.test_hash = recruit_tests.unique_id
          AND recruit_test_feedback.user_email = recruit_test_candidates.email
          AND recruit_test_feedback.inserttime >= recruit_test_candidates.attempt_starttime
  ),

  -- ============================================================
  -- STEP 2: Filter invalid / empty feedback
  -- ============================================================
  valid_feedback AS (
      -- Fix 2: truncated 'SE' keyword corrected to 'SELECT *'
      SELECT * FROM raw_screens
      WHERE any_feedback IS NOT NULL
        AND TRIM(any_feedback) <> ''
        AND LENGTH(TRIM(any_feedback)) > 3
  ),

  -- ============================================================
  -- STEP 3: Classify using any_feedback column
  -- ============================================================
  classified AS (
      SELECT
          *,
          -- --------------------------------------------------------
          -- 1. CONTENT
          -- --------------------------------------------------------
          CASE WHEN
                 lower(any_feedback) like '%question%'
              or lower(any_feedback) like '%problem%'
              or lower(any_feedback) like '%task%'
              or lower(any_feedback) like '%challeng%'
              or lower(any_feedback) like '%assignment%'
            --   or lower(any_feedback) like '%prompt%'
              or lower(any_feedback) like '%problem statement%'
              or lower(any_feedback) like '%test case%'
              or lower(any_feedback) like '%testcase%'
              or lower(any_feedback) like '%test-case%'
              or lower(any_feedback) like '%unclear%'
              or lower(any_feedback) like '%not clear%'
              or lower(any_feedback) like '%poorly worded%'
              or lower(any_feedback) like '%poorly written%'
              or lower(any_feedback) like '%poorly scoped%'
              or lower(any_feedback) like '%lacked clarity%'
              or lower(any_feedback) like '%lack of clarity%'
              or lower(any_feedback) like '%didn''t make sense%'
              or lower(any_feedback) like '%did not make sense%'
              or lower(any_feedback) like '%not enough detail%'
              or lower(any_feedback) like '%more detail%'
              or lower(any_feedback) like '%instructions%'
              or lower(any_feedback) like '%requirement%'

              or lower(any_feedback) like '%project%'
              or lower(any_feedback) like '%repo%'
              or lower(any_feedback) like '%environment%'
              or lower(any_feedback) like '%fullstack%'
              or lower(any_feedback) like '%full stack%'
              or lower(any_feedback) like '%full-stack%'
              or lower(any_feedback) like '%file tree%'
              or lower(any_feedback) like '%multi file%'
              or lower(any_feedback) like '%multi-file%'
              or lower(any_feedback) like '%in-browser%'
              or lower(any_feedback) like '%in browser%'
              or lower(any_feedback) like '%mern%'
              or lower(any_feedback) like '%mean stack%'
              or lower(any_feedback) like '%mevn%'
              or lower(any_feedback) like '%react app%'
              or lower(any_feedback) like '%react js%'
              or lower(any_feedback) like '%reactjs%'
              or lower(any_feedback) like '%react project%'
              or lower(any_feedback) like '%react component%'
              or lower(any_feedback) like '%react frontend%'
              or lower(any_feedback) like '%react native%'
              or lower(any_feedback) like '%react question%'
              or lower(any_feedback) like '%node.js%'
              or lower(any_feedback) like '%nodejs%'
              or lower(any_feedback) like '%node js%'
              or lower(any_feedback) like '%angular%'
              or lower(any_feedback) like '%vue.js%'
              or lower(any_feedback) like '%vuejs%'
              or lower(any_feedback) like '%next.js%'
              or lower(any_feedback) like '%nextjs%'
              or lower(any_feedback) like '%nest.js%'
              or lower(any_feedback) like '%nestjs%'
              or lower(any_feedback) like '%express.js%'
              or lower(any_feedback) like '%expressjs%'
              or lower(any_feedback) like '%svelte%'
              or lower(any_feedback) like '%webpack%'
              or lower(any_feedback) like '%spring boot%'
              or lower(any_feedback) like '%springboot%'
              or lower(any_feedback) like '%spring mvc%'
              or lower(any_feedback) like '%hibernate%'
              or lower(any_feedback) like '%maven%'
              or lower(any_feedback) like '%gradle%'
              or lower(any_feedback) like '%django%'
              or lower(any_feedback) like '%flask%'
              or lower(any_feedback) like '%fastapi%'
              or lower(any_feedback) like '%ruby on rails%'
              or lower(any_feedback) like '%rails app%'
              or lower(any_feedback) like '%rails project%'
              or lower(any_feedback) like '%laravel%'
              or lower(any_feedback) like '% .net %'
              or lower(any_feedback) like '%.net project%'
              or lower(any_feedback) like '%.net app%'
              or lower(any_feedback) like '%asp.net%'
          THEN TRUE ELSE FALSE END AS content,

          -- --------------------------------------------------------
          -- 2. PERFORMANCE
          -- --------------------------------------------------------
          CASE WHEN
                 lower(any_feedback) like '%slow%'
              or lower(any_feedback) like '%laten%'
              or lower(any_feedback) like '%delay%'
              or lower(any_feedback) like '%lagging%'
              or lower(any_feedback) like '%laggy%'
              or lower(any_feedback) like '%a lot of lag%'
              or lower(any_feedback) like '%some lag%'
              or lower(any_feedback) like '%sluggish%'
              or lower(any_feedback) like '%choppy%'
              or lower(any_feedback) like '%choppier%'
              or lower(any_feedback) like '%jank%'
              or lower(any_feedback) like '%stutter%'
              or lower(any_feedback) like '%freez%'
              or lower(any_feedback) like '%hanging%'
              or lower(any_feedback) like '%hung%'
              or lower(any_feedback) like '%screen hang%'
              or lower(any_feedback) like '%stuck%'
              or lower(any_feedback) like '%crash%'
              or lower(any_feedback) like '%glitch%'
              or lower(any_feedback) like '%unresponsive%'
              or lower(any_feedback) like '%not responding%'
              or lower(any_feedback) like '%timed out%'
              or lower(any_feedback) like '%timeout%'
              or lower(any_feedback) like '%buffering%'
              or lower(any_feedback) like '%disconnect%'
              or lower(any_feedback) like '%reconnect%'
              or lower(any_feedback) like '%network%'
              or lower(any_feedback) like '%kicked out%'
              or lower(any_feedback) like '%session expired%'
              or lower(any_feedback) like '%session lost%'
              or lower(any_feedback) like '%session drop%'
              or lower(any_feedback) like '%black screen%'
              or lower(any_feedback) like '%blank screen%'
              or lower(any_feedback) like '%white screen%'
              or lower(any_feedback) like '%not loading%'
              or lower(any_feedback) like '%did not load%'
              or lower(any_feedback) like '%didn''t load%'
              or lower(any_feedback) like '%failed to load%'
              or lower(any_feedback) like '%infinite load%'
              or lower(any_feedback) like '%keeps loading%'
              or lower(any_feedback) like '%performance%'
              or lower(any_feedback) like '%platform issue%'
              or lower(any_feedback) like '%platform problem%'
              or lower(any_feedback) like '%platform crash%'
              or lower(any_feedback) like '%platform down%'
              or lower(any_feedback) like '%platform broken%'
              or lower(any_feedback) like '%battled with%'
              or lower(any_feedback) like '%constantly fail%'
              or lower(any_feedback) like '%constantly crash%'
              or lower(any_feedback) like '%didn''t work%'
              or lower(any_feedback) like '%not working%'
          THEN TRUE ELSE FALSE END AS performance,

          -- --------------------------------------------------------
          -- 3. AI_ASSISTANT
          -- --------------------------------------------------------
          CASE WHEN
                 lower(any_feedback) like '%ai assis%'
              or lower(any_feedback) like '%ai agent%'
              or lower(raw_feedback_text) like '% agent %'
              or lower(raw_feedback_text) like '%agent %'
              or lower(raw_feedback_text) like '% agent%'
              or lower(raw_feedback_text) like '% assistant %'
              or lower(raw_feedback_text) like '%assistant %'
              or lower(raw_feedback_text) like '% assistant%'
              or lower(any_feedback) like '%ai tool%'
              or lower(any_feedback) like '%ai chat%'
              or lower(any_feedback) like '%ai suggestion%'
              or lower(any_feedback) like '%ai integration%'
              or lower(any_feedback) like '%ai feature%'
              or lower(any_feedback) like '%ai-assis%'
              or lower(any_feedback) like '%ai-agent%'
              or lower(any_feedback) like '%ai-tool%'
              or lower(any_feedback) like '%ai-chat%'
              or lower(any_feedback) like '%ai-suggestion%'
              or lower(any_feedback) like '%ai-integration%'
              or lower(any_feedback) like '%ai-feature%'
              or lower(any_feedback) like '%copilot%'
              or lower(any_feedback) like '%cursor ai%'
              or lower(any_feedback) like '%cursor tool%'
              or lower(any_feedback) like '%inline suggestion%'
              or lower(any_feedback) like '%inline completion%'
              or lower(any_feedback) like '%inline hint%'
              or lower(any_feedback) like '%ghost text%'
              or lower(any_feedback) like '%tab complet%'
              or lower(any_feedback) like '%autofill%'
              or lower(any_feedback) like '%auto fill%'
              or lower(any_feedback) like '%auto-fill%'
              or lower(any_feedback) like '%code suggestion%'
              or lower(any_feedback) like '%code hint%'
              or lower(any_feedback) like '%agent mode%'
              or lower(any_feedback) like '%llm %'
              or lower(any_feedback) like '%chatgpt%'
              or lower(any_feedback) like '%generative ai%'
              or lower(any_feedback) like '%autocomplete%'
              or lower(any_feedback) like '%intellisense%'
          THEN TRUE ELSE FALSE END AS ai_assistant,

          -- --------------------------------------------------------
          -- 4. UIUX
          -- --------------------------------------------------------
          CASE WHEN
                 lower(any_feedback) like '%couldn''t find%'
              or lower(any_feedback) like '%could not find%'
              or lower(any_feedback) like '%didn''t find%'
              or lower(any_feedback) like '%did not find%'
              or lower(any_feedback) like '%couldn''t see%'
              or lower(any_feedback) like '%could not see%'
              or lower(any_feedback) like '%didn''t see%'
              or lower(any_feedback) like '%did not see%'
              or lower(any_feedback) like '%couldn''t figure out%'
              or lower(any_feedback) like '%could not figure out%'
              or lower(any_feedback) like '%hard to figure out%'
              or lower(any_feedback) like '%not able to figure%'
              or lower(any_feedback) like '%struggled to find%'
              or lower(any_feedback) like '%struggled finding%'
              or lower(any_feedback) like '%searching for%'
              or lower(any_feedback) like '%spent time looking%'
              or lower(any_feedback) like '%confus%'
              or lower(any_feedback) like '%intuitiv%'
              or lower(any_feedback) like '%not easy to use%'
              or lower(any_feedback) like '%not easy to navigate%'
              or lower(any_feedback) like '%not easy to understand%'
              or lower(any_feedback) like '%hard to use%'
              or lower(any_feedback) like '%hard to navigate%'
              or lower(any_feedback) like '%hard to find%'
              or lower(any_feedback) like '%difficult to use%'
              or lower(any_feedback) like '%difficult to navigate%'
              or lower(any_feedback) like '%difficult to find%'
              or lower(any_feedback) like '%ui/ux%'
              or lower(any_feedback) like '%ui ux%'
              or lower(any_feedback) like '% ui %'
              or lower(any_feedback) like '% ux %'
              or lower(any_feedback) like '%user exp%'
              or lower(any_feedback) like '%clunky%'
              or lower(any_feedback) like '%cluttered%'
              or lower(any_feedback) like '%too many tabs%'
              or lower(any_feedback) like '%multiple tabs%'
              or lower(any_feedback) like '%open tabs%'
              or lower(any_feedback) like '%switching tabs%'
              or lower(any_feedback) like '%different tabs%'
              or lower(any_feedback) like '%across tabs%'
              or lower(any_feedback) like '%scroll%'
              or lower(any_feedback) like '%browser window%'
              or lower(any_feedback) like '%window size%'
              or lower(any_feedback) like '%window froze%'
              or lower(any_feedback) like '%window hung%'
              or lower(any_feedback) like '%multiple windows%'
              or lower(any_feedback) like '%new window%'
              or lower(any_feedback) like '%screen size%'
              or lower(any_feedback) like '%pop-up%'
              or lower(any_feedback) like '%popup%'
              or lower(any_feedback) like '%pop up%'
              or lower(any_feedback) like '%accidentally%'
              or lower(any_feedback) like '% button%'
              or lower(any_feedback) like '%couldn''t submit%'
              or lower(any_feedback) like '%did not know how to submit%'
              or lower(any_feedback) like '%didn''t know how to submit%'
              or lower(any_feedback) like '%terminal hidden%'
              or lower(any_feedback) like '%couldn''t find terminal%'
              or lower(any_feedback) like '%terminal not visible%'
              or lower(any_feedback) like '%layout%'
              or lower(any_feedback) like '%navigation%'
              or lower(any_feedback) like '%interface%'
              or lower(any_feedback) like '%overwhelming%'
              or lower(any_feedback) like '%custom input%'
              or lower(any_feedback) like '%input field%'
              or lower(any_feedback) like '%input %'
              or lower(any_feedback) like '%text box%'
              or lower(any_feedback) like '%textbox%'
          THEN TRUE ELSE FALSE END AS uiux,

          -- --------------------------------------------------------
          -- 5. CORE_IDE
          -- --------------------------------------------------------
          CASE WHEN
                 lower(any_feedback) like '% ide %'
            or lower(raw_feedback_text) like '%ide %'
            or lower(raw_feedback_text) like '%preview %'
            or lower(raw_feedback_text) like '% preview %'
              or lower(any_feedback) like '%editor%'
              or lower(any_feedback) like '%starter code%'
              or lower(any_feedback) like '%starter_code%'
              or lower(any_feedback) like '%test suite%'
              or lower(any_feedback) like '%test_suite%'
              or lower(any_feedback) like '%vscode%'
              or lower(any_feedback) like '%vs code%'
              or lower(any_feedback) like '%intellij%'
              or lower(any_feedback) like '%webstorm%'
              or lower(any_feedback) like '%sublime%'
              or lower(any_feedback) like '%debug%'
              or lower(any_feedback) like '%breakpoint%'
              or lower(any_feedback) like '%stack trace%'
              or lower(any_feedback) like '%step through%'
              or lower(any_feedback) like '%console%'
              or lower(any_feedback) like '%terminal%'
              or lower(any_feedback) like '%console.log%'
              or lower(any_feedback) like '%stdout%'
              or lower(any_feedback) like '%stderr%'
              or lower(any_feedback) like '%no output%'
              or lower(any_feedback) like '%output missing%'
              or lower(any_feedback) like '%output not showing%'
              or lower(any_feedback) like '%test runner%'
              or lower(any_feedback) like '%run code%'
              or lower(any_feedback) like '%execute code%'
              or lower(any_feedback) like '%couldn''t run%'
              or lower(any_feedback) like '%could not run%'
              or lower(any_feedback) like '%can''t run%'
              or lower(any_feedback) like '%compil%'
              or lower(any_feedback) like '%syntax highlight%'
              or lower(any_feedback) like '%linter%'
              or lower(any_feedback) like '%eslint%'
              or lower(any_feedback) like '%pylint%'
              or lower(any_feedback) like '%formatter%'
              or lower(any_feedback) like '%prettier%'
              or lower(any_feedback) like '%import error%'
              or lower(any_feedback) like '%import issue%'
              or lower(any_feedback) like '%import fail%'
              or lower(any_feedback) like '%import problem%'
              or lower(any_feedback) like '%import statement%'
              or lower(any_feedback) like '%couldn''t import%'
              or lower(any_feedback) like '%could not import%'
              or lower(any_feedback) like '%module not found%'
              or lower(any_feedback) like '%package not found%'
              or lower(any_feedback) like '%unresolved%'
              or lower(any_feedback) like '%keyboard shortcut%'
              or lower(any_feedback) like '%keybinding%'
              or lower(any_feedback) like '%hotkey%'
              or lower(any_feedback) like '%indentation%'
              or lower(any_feedback) like '%word wrap%'
              or lower(any_feedback) like '%bracket match%'
              or lower(any_feedback) like '%split view%'
              or lower(any_feedback) like '%split screen%'
              or lower(any_feedback) like '%version control%'
              or lower(any_feedback) like '%git integration%'
              or lower(any_feedback) like '%language support%'
              or lower(any_feedback) like '%language option%'
              or lower(any_feedback) like '%docker%'
              or lower(any_feedback) like '%container%'
              or lower(any_feedback) like '%kubernetes%'
              or lower(any_feedback) like '%microservice%'
              or lower(any_feedback) like '%monorepo%'
              or lower(any_feedback) like '%mono repo%'
              or lower(any_feedback) like '%npm%'
              or lower(any_feedback) like '%yarn%'
              or lower(any_feedback) like '%clone%'
              or lower(any_feedback) like '%dependency%'
              or lower(any_feedback) like '%dependencies%'
              or lower(any_feedback) like '%server start%'
              or lower(any_feedback) like '%server crash%'
              or lower(any_feedback) like '%server fail%'
              or lower(any_feedback) like '%server not%'
          THEN TRUE ELSE FALSE END AS core_ide

      FROM valid_feedback
  ),

  -- ============================================================
  -- STEP 4: Fallback classification
  -- ============================================================
  final_classified AS (
      SELECT
          *,
          CASE
              WHEN NOT (content OR performance OR ai_assistant
                        OR uiux OR core_ide )
               AND LENGTH(TRIM(any_feedback)) <= 40
              THEN TRUE ELSE FALSE
          END AS generic,
          CASE
              WHEN NOT (content OR performance OR ai_assistant
                        OR uiux OR core_ide )
               AND LENGTH(TRIM(any_feedback)) > 40
              THEN TRUE ELSE FALSE
          END AS others_unmatched
      FROM classified
  ),

attempt_question_data AS (
    SELECT
        rsc.test_id,
        rsc.attempt_id,
        split_to_array(rad.value, '-') AS question_list
    FROM raw_screens rsc
    LEFT JOIN recruit.recruit_attempt_data rad
        ON rsc.attempt_id = rad.aid
        AND rad.key = 'questions'
        -- Fix 3: malformed CAST — closing paren was before AS DATE
        AND rsc.attempt_started_date BETWEEN CAST(TIMESTAMP '{{start_date}}' AS DATE) AND CAST(TIMESTAMP '{{end_date}}' AS DATE)
),

attempt_question_data_split AS (
    SELECT
        qd.*,
        -- Fix 4: PostgreSQL ::varchar cast replaced with Trino CAST syntax
        replace(CAST(question_list_1 AS VARCHAR), '"', ' ') AS question_id
    FROM attempt_question_data qd,
        qd.question_list question_list_1
    -- Fix 9: removed ORDER BY inside CTE (invalid in Trino without LIMIT)
    GROUP BY 1,2,3,4
)

  -- ============================================================
  -- FINAL OUTPUT
  -- ============================================================
SELECT * FROM
  (SELECT
      feedback_source,
      attempt_started_date,
      company_id,
      company_name,
      test_id,
      test_name,
      attempt_id,
      candidate_email,

      -- Salesforce enrichment
      company_service_type,
      salesforce_HQ_region,

      -- Classification flags
      product_rating,
      raw_feedback_text,
      feedback_options_selected,
      content,
      performance,
      ai_assistant,
      uiux,
      core_ide,
      generic,
      others_unmatched,

      -- Human readable matched categories
      TRIM(TRAILING ',' FROM TRIM(
          CASE WHEN content          THEN 'content, '          ELSE '' END ||
          CASE WHEN performance      THEN 'performance, '      ELSE '' END ||
          CASE WHEN ai_assistant     THEN 'ai_assistant, '     ELSE '' END ||
          CASE WHEN uiux             THEN 'uiux, '             ELSE '' END ||
          CASE WHEN core_ide         THEN 'core_ide, '         ELSE '' END ||
          CASE WHEN generic          THEN 'generic, '          ELSE '' END ||
          CASE WHEN others_unmatched THEN 'others_unmatched'   ELSE '' END
      )) AS matched_categories,

      -- Count of matched categories
      (CASE WHEN content          THEN 1 ELSE 0 END +
       CASE WHEN performance      THEN 1 ELSE 0 END +
       CASE WHEN ai_assistant     THEN 1 ELSE 0 END +
       CASE WHEN uiux             THEN 1 ELSE 0 END +
       CASE WHEN core_ide         THEN 1 ELSE 0 END +
       CASE WHEN others_unmatched THEN 1 ELSE 0 END) AS category_match_count,

      rcq.id   AS question_id,
      rcq.name AS question_name,
      rcq.type AS question_type_raw,
      CASE
           WHEN rcq.type IN ('fullstack','sudorank', 'cloud', 'project') THEN 'project'
           WHEN rcq.type IN ('code','coding', 'approx')                  THEN 'coding'
           WHEN rcq.type IN ('mcq','multiple_mcq')                       THEN 'mcq'
           WHEN rcq.type IN ('database')                                 THEN 'database'
           ELSE 'others'
      END AS question_type_high_level,
      -- Fix 5/6/7: json_extract_path_text (Redshift) replaced with JSON_EXTRACT_SCALAR (Trino)
      --            ::integer cast replaced with CAST(... AS INTEGER)
      --            missing commas added after question_type_high_level and question_creation_type
      CASE
           WHEN CAST(JSON_EXTRACT_SCALAR(rcq.custom, '$.company') AS INTEGER) = 14357
                THEN 'library'
           WHEN CAST(JSON_EXTRACT_SCALAR(rcq.custom, '$.company') AS INTEGER) <> 14357
                AND JSON_EXTRACT_SCALAR(rcq.custom, '$.added_to_library_on') <> ''
                THEN 'cloned'
           WHEN CAST(JSON_EXTRACT_SCALAR(rcq.custom, '$.company') AS INTEGER) <> 14357
                AND JSON_EXTRACT_SCALAR(rcq.custom, '$.added_to_library_on') = ''
                THEN 'custom'
      END AS question_creation_type,
      JSON_EXTRACT_SCALAR(rcq.type_attributes, '$.role_type') AS role_type

  FROM final_classified a
  INNER JOIN attempt_question_data_split b ON a.attempt_id = b.attempt_id
  -- Fix 8: added missing ON clause for hudi.content.questions join
  INNER JOIN hudi.content.questions AS rcq ON CAST(b.question_id AS INTEGER) = rcq.id
  ) a

WHERE (CASE WHEN {{question_type_raw (enter '-1' for all question_types)}} = -1 THEN TRUE ELSE a.question_type_raw = {{question_type_raw (enter '-1' for all question_types)}} END)
ORDER BY attempt_started_date DESC
