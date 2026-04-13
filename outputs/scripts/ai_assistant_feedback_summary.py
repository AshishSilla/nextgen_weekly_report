"""
ai_assistant_feedback_summary.py
---------------------------------
Two-part analysis of candidate feedback on AI-assisted screen tests.

Part 1 — All companies (2026-01-01 onwards):
  A. Week-on-week positive DLI (rating >= 4) counts
  C. All raw feedback verbatims + bucket classifications (any rating)
     → Query B (WoW bucket theme breakdown, rating >= 4) derived from C in Python

Part 2 — Walmart (37714) & Amazon (115581):
  D. AI-assisted test IDs
  E. DLI summary per test
  F. All candidate remarks (any rating) + attempt_id, email, date
  G. Score distribution (10-pt buckets)

Source of truth for "used AI Assistant" = starrocks_bizops.analytics.stg_fu_ai_assistant_question
(entity_type = 'attempt', user_msg_cnt > 3)

Usage:
  python3 outputs/scripts/ai_assistant_feedback_summary.py
"""

import csv
import collections
import os
import sys
import textwrap
from datetime import date, datetime

from dotenv import load_dotenv
import trino
from trino.auth import BasicAuthentication

# ── Config ───────────────────────────────────────────────────────────────────

load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env')
)

START_DATE  = '2026-01-01'
END_DATE    = '2026-04-10'
COMPANY_IDS = (37714, 115581)   # Walmart, Amazon

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

THEME_DISPLAY = {
    'content':          'Question quality',
    'performance':      'Platform reliability',
    'ai_assistant':     'AI assistance experience',
    'uiux':             'Platform ease of use',
    'core_ide':         'Coding environment',
    'generic':          'Generic (short)',
    'others_unmatched': 'Other',
}

# Keyword groups for TA-proof-point tagging (applied in Python post-processing)
TA_TAGS = {
    'candidate_experience': [
        'experience', 'smooth', 'easy', 'clean', 'intuitive', 'user-friendly',
        'comfortable', 'well-designed', 'great platform', 'loved', 'enjoyed',
        'felt good', 'nice environment',
    ],
    'test_quality': [
        'relevant', 'real-world', 'practical', 'challenging', 'fair', 'balanced',
        'well-structured', 'realistic', 'good question', 'good problem',
    ],
    'ai_helpfulness': [
        'assistant', 'ai', 'suggestion', 'hint', 'helpful', 'autocomplete',
        'guidance', 'helped me', 'ai tool', 'code hint',
    ],
    'platform_reliability': [
        'fast', 'responsive', 'stable', 'no issues', 'worked well', 'ran well',
        'smooth', 'no lag', 'loaded quickly',
    ],
    'recommendation': [
        'would recommend', 'impressive', 'innovative', 'modern', 'excellent',
        'outstanding', 'well done', 'kudos',
    ],
}


def tag_verbatim(text: str) -> str:
    """Return comma-separated TA proof-point tags for a feedback string."""
    if not text:
        return ''
    lower = text.lower()
    matched = [tag for tag, kws in TA_TAGS.items() if any(kw in lower for kw in kws)]
    return ', '.join(matched)


# ── Trino connection ──────────────────────────────────────────────────────────

def get_conn():
    return trino.dbapi.connect(
        host=os.environ['TRINO_HOST'],
        port=int(os.environ.get('TRINO_PORT', 443)),
        user=os.environ['TRINO_USER'],
        auth=BasicAuthentication(
            os.environ['TRINO_USER'],
            os.environ['TRINO_PASSWORD'],
        ),
        http_scheme=os.environ.get('TRINO_HTTP_SCHEME', 'https'),
        verify=os.environ.get('TRINO_VERIFY_SSL', 'true').lower() == 'true',
        catalog=os.environ.get('TRINO_CATALOG', 'hudi'),
        request_timeout=600,
    )


def run_query(conn, sql: str, label: str) -> tuple[list[str], list[tuple]]:
    print(f'\n[>] Running: {label} ...', flush=True)
    cur = conn.cursor()
    cur.execute(sql)
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    print(f'    → {len(rows)} rows', flush=True)
    return cols, rows


def save_csv(path: str, cols: list[str], rows: list[tuple]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(rows)
    print(f'    Saved → {os.path.relpath(path)}')


# ── SQL definitions ───────────────────────────────────────────────────────────

# Shared: AI-assisted attempts CTE
AI_ATTEMPTS_CTE = f"""
ai_assisted_attempts AS (
    SELECT DISTINCT entity_id AS attempt_id
    FROM starrocks_bizops.analytics.stg_fu_ai_assistant_question
    WHERE entity_type  = 'attempt'
      AND user_msg_cnt > 3
      AND test_id IS NOT NULL
      AND used_date >= DATE '{START_DATE}'
)"""

# Shared: ever-paid companies CTE (from query 17419 pattern)
EVER_PAID_CTE = """
ever_paid AS (
    SELECT DISTINCT company_id
    FROM hudi.recruit.recruit_company_plan_changelogs
    WHERE plan_name NOT IN ('free','trial','user-freemium-interviews-v1','locked')
    UNION
    SELECT DISTINCT id
    FROM hudi.recruit.recruit_companies
    WHERE stripe_plan NOT IN ('free','trial','user-freemium-interviews-v1','locked')
      AND type NOT IN ('free','trial','locked')
)"""

# ── Query A: WoW positive DLI (all paid companies, AI-assisted only) ──────────

QUERY_A = f"""
WITH
{AI_ATTEMPTS_CTE.lstrip()},
{EVER_PAID_CTE.lstrip()}
SELECT
    format_datetime(date_trunc('week', rtc.attempt_starttime), 'yyyy-MM-dd') AS attempt_week,
    COUNT(DISTINCT rtc.attempt_id)                                             AS attempts_with_positive_dli,
    ROUND(AVG(CAST(rtf.product_rating AS DOUBLE)), 2)                          AS avg_dli,
    COUNT(CASE WHEN rtf.product_rating = 5 THEN 1 END)                         AS rating_5,
    COUNT(CASE WHEN rtf.product_rating = 4 THEN 1 END)                         AS rating_4
FROM hudi.recruit.recruit_test_candidates rtc
JOIN hudi.recruit.recruit_tests rt
    ON rt.id = rtc.test_id
JOIN ever_paid ep
    ON ABS(rt.company_id) = ep.company_id
JOIN ai_assisted_attempts ai
    ON CAST(rtc.attempt_id AS VARCHAR) = ai.attempt_id
JOIN hudi.recruit.recruit_test_feedback rtf
    ON rtf.test_hash = rt.unique_id
   AND rtf.user_email = rtc.email
WHERE DATE(rtc.attempt_starttime) >= DATE '{START_DATE}'
  AND rt.state <> 3
  AND rtc.valid = 1
  AND COALESCE(rtc.email,'') NOT LIKE '%@hackerrank.com'
  AND COALESCE(rtc.email,'') NOT LIKE '%@hackerrank.net'
  AND COALESCE(rtc.email,'') NOT LIKE '%sandbox17e2d93e4afe44ea889d89aadf6d413f.mailgun.org'
  AND COALESCE(rtc.email,'') NOT LIKE '%@strongqa.com'
  AND rtf.product_rating >= 4
GROUP BY 1
ORDER BY 1
"""

# ── Query C: All raw feedback verbatims + bucket classification ───────────────
# (Query B WoW bucket breakdown is derived from this in Python)

QUERY_C = f"""
WITH
{AI_ATTEMPTS_CTE.lstrip()},

current_paid_customers AS (
    SELECT
        CAST(account.hrid_C AS INT)               AS company_id,
        account.name                               AS salesforce_account_name,
        CASE
            WHEN account.type = 'Customer'     THEN 'full_serve'
            WHEN account.type = 'Subscription' THEN 'self_serve'
        END                                        AS company_service_type,
        account.region_c                           AS salesforce_region
    FROM hudi.salesforce.account AS account
    WHERE account.hrid_C <> ''
      AND account.hrid_C <> ' '
      AND account.hrid_C IS NOT NULL
      AND substr(account.hrid_C, 1, 1) <> 'D'
      AND account.type IN ('Customer','Subscription')
),

raw_screens AS (
    SELECT DISTINCT
        DATE(recruit_test_candidates.attempt_starttime)                          AS attempt_started_date,
        rc.name                                                                  AS company_name,
        recruit_tests.id                                                         AS test_id,
        recruit_tests.name                                                       AS test_name,
        recruit_test_candidates.attempt_id                                       AS attempt_id,
        recruit_test_candidates.email                                            AS candidate_email,
        recruit_test_feedback.product_rating,
        recruit_test_feedback.comments                                           AS raw_feedback_text,
        JSON_EXTRACT_SCALAR(
            TRY(json_parse(recruit_test_feedback.metadata)), '$.feedback_options'
        )                                                                        AS feedback_options_selected,
        COALESCE(recruit_test_feedback.comments, '')
            || ' '
            || COALESCE(
                JSON_EXTRACT_SCALAR(
                    TRY(json_parse(recruit_test_feedback.metadata)), '$.feedback_options'
                ), ''
               )                                                                 AS any_feedback
    FROM current_paid_customers ever_paid
    INNER JOIN hudi.recruit.recruit_companies rc
        ON ABS(ever_paid.company_id) = rc.id
       AND LOWER(rc.name) NOT IN ('none', ' ', 'hackerra', 'interviewstreet')
       AND LOWER(rc.name) NOT LIKE '%hackerrank%'
       AND LOWER(rc.name) NOT LIKE '%hacker%rank%'
       AND LOWER(rc.name) NOT LIKE '%interviewstreet%'
       AND rc.name NOT LIKE 'Company%'
    INNER JOIN recruit.recruit_tests AS recruit_tests
        ON ABS(recruit_tests.company_id) = ABS(ever_paid.company_id)
    INNER JOIN recruit.recruit_test_candidates AS recruit_test_candidates
        ON recruit_tests.id = recruit_test_candidates.test_id
       AND recruit_test_candidates.attempt_starttime
               BETWEEN TIMESTAMP '{START_DATE}' AND TIMESTAMP '{END_DATE}'
       AND recruit_tests.state <> 3
       AND recruit_test_candidates.valid = 1
       AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%@hackerrank.com'
       AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%@hackerrank.net'
       AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%sandbox17e2d93e4afe44ea889d89aadf6d413f.mailgun.org'
       AND COALESCE(recruit_test_candidates.email, '') NOT LIKE '%@strongqa.com'
    INNER JOIN recruit.recruit_test_feedback AS recruit_test_feedback
        ON recruit_test_feedback.test_hash = recruit_tests.unique_id
       AND recruit_test_feedback.user_email = recruit_test_candidates.email
       AND recruit_test_feedback.inserttime >= recruit_test_candidates.attempt_starttime
    INNER JOIN ai_assisted_attempts ai
        ON CAST(recruit_test_candidates.attempt_id AS VARCHAR) = ai.attempt_id
),

valid_feedback AS (
    SELECT * FROM raw_screens
    WHERE any_feedback IS NOT NULL
      AND TRIM(any_feedback) <> ''
      AND LENGTH(TRIM(any_feedback)) > 3
),

classified AS (
    SELECT
        *,
        -- 1. CONTENT
        CASE WHEN
               lower(any_feedback) like '%question%'
            or lower(any_feedback) like '%problem%'
            or lower(any_feedback) like '%task%'
            or lower(any_feedback) like '%challeng%'
            or lower(any_feedback) like '%assignment%'
            or lower(any_feedback) like '%problem statement%'
            or lower(any_feedback) like '%test case%'
            or lower(any_feedback) like '%unclear%'
            or lower(any_feedback) like '%not clear%'
            or lower(any_feedback) like '%poorly worded%'
            or lower(any_feedback) like '%poorly written%'
            or lower(any_feedback) like '%lacked clarity%'
            or lower(any_feedback) like '%lack of clarity%'
            or lower(any_feedback) like '%instructions%'
            or lower(any_feedback) like '%requirement%'
            or lower(any_feedback) like '%project%'
            or lower(any_feedback) like '%repo%'
            or lower(any_feedback) like '%environment%'
            or lower(any_feedback) like '%fullstack%'
            or lower(any_feedback) like '%full stack%'
            or lower(any_feedback) like '%react app%'
            or lower(any_feedback) like '%node.js%'
            or lower(any_feedback) like '%nodejs%'
            or lower(any_feedback) like '%angular%'
            or lower(any_feedback) like '%django%'
            or lower(any_feedback) like '%flask%'
            or lower(any_feedback) like '%spring boot%'
        THEN TRUE ELSE FALSE END AS content,

        -- 2. PERFORMANCE
        CASE WHEN
               lower(any_feedback) like '%slow%'
            or lower(any_feedback) like '%laten%'
            or lower(any_feedback) like '%delay%'
            or lower(any_feedback) like '%lagging%'
            or lower(any_feedback) like '%laggy%'
            or lower(any_feedback) like '%sluggish%'
            or lower(any_feedback) like '%freez%'
            or lower(any_feedback) like '%stuck%'
            or lower(any_feedback) like '%crash%'
            or lower(any_feedback) like '%glitch%'
            or lower(any_feedback) like '%unresponsive%'
            or lower(any_feedback) like '%not responding%'
            or lower(any_feedback) like '%timed out%'
            or lower(any_feedback) like '%timeout%'
            or lower(any_feedback) like '%disconnect%'
            or lower(any_feedback) like '%black screen%'
            or lower(any_feedback) like '%blank screen%'
            or lower(any_feedback) like '%not loading%'
            or lower(any_feedback) like '%failed to load%'
            or lower(any_feedback) like '%performance%'
            or lower(any_feedback) like '%not working%'
        THEN TRUE ELSE FALSE END AS performance,

        -- 3. AI_ASSISTANT
        CASE WHEN
               lower(any_feedback) like '%ai assis%'
            or lower(any_feedback) like '%ai agent%'
            or lower(raw_feedback_text) like '% agent %'
            or lower(raw_feedback_text) like '% assistant %'
            or lower(any_feedback) like '%ai tool%'
            or lower(any_feedback) like '%ai chat%'
            or lower(any_feedback) like '%ai suggestion%'
            or lower(any_feedback) like '%copilot%'
            or lower(any_feedback) like '%inline suggestion%'
            or lower(any_feedback) like '%code suggestion%'
            or lower(any_feedback) like '%tab complet%'
            or lower(any_feedback) like '%autofill%'
            or lower(any_feedback) like '%autocomplete%'
            or lower(any_feedback) like '%llm %'
            or lower(any_feedback) like '%chatgpt%'
            or lower(any_feedback) like '%generative ai%'
            or lower(any_feedback) like '%intellisense%'
        THEN TRUE ELSE FALSE END AS ai_assistant,

        -- 4. UIUX
        CASE WHEN
               lower(any_feedback) like '%couldn''t find%'
            or lower(any_feedback) like '%could not find%'
            or lower(any_feedback) like '%couldn''t figure out%'
            or lower(any_feedback) like '%confus%'
            or lower(any_feedback) like '%intuitiv%'
            or lower(any_feedback) like '%not easy to use%'
            or lower(any_feedback) like '%hard to use%'
            or lower(any_feedback) like '%hard to navigate%'
            or lower(any_feedback) like '%difficult to use%'
            or lower(any_feedback) like '%ui/ux%'
            or lower(any_feedback) like '%user exp%'
            or lower(any_feedback) like '%clunky%'
            or lower(any_feedback) like '%scroll%'
            or lower(any_feedback) like '%layout%'
            or lower(any_feedback) like '%navigation%'
            or lower(any_feedback) like '%interface%'
            or lower(any_feedback) like '%overwhelming%'
            or lower(any_feedback) like '% button%'
        THEN TRUE ELSE FALSE END AS uiux,

        -- 5. CORE_IDE
        CASE WHEN
               lower(any_feedback) like '% ide %'
            or lower(raw_feedback_text) like '%ide %'
            or lower(any_feedback) like '%editor%'
            or lower(any_feedback) like '%vscode%'
            or lower(any_feedback) like '%vs code%'
            or lower(any_feedback) like '%debug%'
            or lower(any_feedback) like '%terminal%'
            or lower(any_feedback) like '%console%'
            or lower(any_feedback) like '%test runner%'
            or lower(any_feedback) like '%compil%'
            or lower(any_feedback) like '%syntax highlight%'
            or lower(any_feedback) like '%linter%'
            or lower(any_feedback) like '%import error%'
            or lower(any_feedback) like '%module not found%'
            or lower(any_feedback) like '%keyboard shortcut%'
            or lower(any_feedback) like '%docker%'
            or lower(any_feedback) like '%npm%'
            or lower(any_feedback) like '%dependencies%'
        THEN TRUE ELSE FALSE END AS core_ide

    FROM valid_feedback
),

final_classified AS (
    SELECT
        *,
        CASE
            WHEN NOT (content OR performance OR ai_assistant OR uiux OR core_ide)
             AND LENGTH(TRIM(any_feedback)) <= 40
            THEN TRUE ELSE FALSE
        END AS generic,
        CASE
            WHEN NOT (content OR performance OR ai_assistant OR uiux OR core_ide)
             AND LENGTH(TRIM(any_feedback)) > 40
            THEN TRUE ELSE FALSE
        END AS others_unmatched
    FROM classified
)

SELECT
    attempt_started_date,
    format_datetime(date_trunc('week', attempt_started_date), 'yyyy-MM-dd') AS attempt_week,
    attempt_id,
    candidate_email,
    company_name,
    test_id,
    test_name,
    product_rating,
    raw_feedback_text,
    feedback_options_selected,
    TRIM(TRAILING ',' FROM TRIM(
        CASE WHEN content          THEN 'content, '          ELSE '' END ||
        CASE WHEN performance      THEN 'performance, '      ELSE '' END ||
        CASE WHEN ai_assistant     THEN 'ai_assistant, '     ELSE '' END ||
        CASE WHEN uiux             THEN 'uiux, '             ELSE '' END ||
        CASE WHEN core_ide         THEN 'core_ide, '         ELSE '' END ||
        CASE WHEN generic          THEN 'generic, '          ELSE '' END ||
        CASE WHEN others_unmatched THEN 'others_unmatched'   ELSE '' END
    ))                                                        AS matched_categories,
    CAST(content          AS INT) AS content,
    CAST(performance      AS INT) AS performance,
    CAST(ai_assistant     AS INT) AS ai_assistant,
    CAST(uiux             AS INT) AS uiux,
    CAST(core_ide         AS INT) AS core_ide,
    CAST(generic          AS INT) AS generic,
    CAST(others_unmatched AS INT) AS others_unmatched
FROM final_classified
WHERE raw_feedback_text IS NOT NULL
  AND TRIM(raw_feedback_text) <> ''
  AND LENGTH(TRIM(raw_feedback_text)) > 15
ORDER BY attempt_started_date DESC
"""

# ── Query D: AI-assisted test IDs for Walmart + Amazon ───────────────────────

QUERY_D = f"""
SELECT DISTINCT
    ai.test_id,
    rt.name   AS test_name,
    rc.id     AS company_id,
    rc.name   AS company_name
FROM starrocks_bizops.analytics.stg_fu_ai_assistant_question ai
JOIN hudi.recruit.recruit_tests rt
    ON CAST(ai.test_id AS INTEGER) = rt.id
JOIN hudi.recruit.recruit_companies rc
    ON rt.company_id = rc.id
WHERE ai.entity_type  = 'attempt'
  AND ai.user_msg_cnt > 3
  AND ai.test_id IS NOT NULL
  AND ai.used_date >= DATE '{START_DATE}'
  AND rc.id IN {COMPANY_IDS}
ORDER BY rc.name, ai.test_id
"""

# ── Query E: DLI summary per test (Walmart + Amazon) ─────────────────────────

QUERY_E = f"""
WITH ai_tests AS (
    SELECT DISTINCT CAST(test_id AS INTEGER) AS test_id
    FROM starrocks_bizops.analytics.stg_fu_ai_assistant_question
    WHERE entity_type  = 'attempt'
      AND user_msg_cnt > 3
      AND test_id IS NOT NULL
      AND used_date >= DATE '{START_DATE}'
)
SELECT
    rc.name                                                          AS company_name,
    rt.name                                                          AS test_name,
    COUNT(*)                                                         AS total_feedback,
    ROUND(AVG(CAST(rtf.product_rating AS DOUBLE)), 2)               AS avg_dli,
    COUNT(CASE WHEN rtf.product_rating = 5 THEN 1 END)              AS rating_5,
    COUNT(CASE WHEN rtf.product_rating = 4 THEN 1 END)              AS rating_4,
    COUNT(CASE WHEN rtf.product_rating = 3 THEN 1 END)              AS rating_3,
    COUNT(CASE WHEN rtf.product_rating = 2 THEN 1 END)              AS rating_2,
    COUNT(CASE WHEN rtf.product_rating = 1 THEN 1 END)              AS rating_1,
    ROUND(COUNT(CASE WHEN rtf.product_rating >= 4 THEN 1 END)
          * 100.0 / NULLIF(COUNT(*), 0), 1)                         AS pct_positive
FROM hudi.recruit.recruit_test_feedback rtf
JOIN hudi.recruit.recruit_tests rt
    ON rtf.test_hash = rt.unique_id
JOIN hudi.recruit.recruit_companies rc
    ON rt.company_id = rc.id
JOIN ai_tests at
    ON rt.id = at.test_id
WHERE rc.id IN {COMPANY_IDS}
  AND rtf.product_rating IS NOT NULL
  AND DATE(rtf.inserttime) >= DATE '{START_DATE}'
GROUP BY rc.name, rt.name
ORDER BY company_name, test_name
"""

# ── Query F: All candidate remarks for Walmart + Amazon ──────────────────────

QUERY_F = f"""
WITH ai_tests AS (
    SELECT DISTINCT CAST(test_id AS INTEGER) AS test_id
    FROM starrocks_bizops.analytics.stg_fu_ai_assistant_question
    WHERE entity_type  = 'attempt'
      AND user_msg_cnt > 3
      AND test_id IS NOT NULL
      AND used_date >= DATE '{START_DATE}'
)
SELECT
    DATE(rtc.attempt_starttime)   AS attempt_date,
    rtc.attempt_id,
    rtc.email                     AS candidate_email,
    rc.name                       AS company_name,
    rt.name                       AS test_name,
    rtf.product_rating,
    rtf.comments                  AS feedback_text
FROM hudi.recruit.recruit_test_feedback rtf
JOIN hudi.recruit.recruit_tests rt
    ON rtf.test_hash = rt.unique_id
JOIN hudi.recruit.recruit_companies rc
    ON rt.company_id = rc.id
JOIN hudi.recruit.recruit_test_candidates rtc
    ON rtc.test_id  = rt.id
   AND rtc.email    = rtf.user_email
   AND rtc.valid    = 1
JOIN ai_tests at
    ON rt.id = at.test_id
WHERE rc.id IN {COMPANY_IDS}
  AND rtf.comments IS NOT NULL
  AND TRIM(rtf.comments) <> ''
  AND LENGTH(TRIM(rtf.comments)) > 10
  AND DATE(rtc.attempt_starttime) >= DATE '{START_DATE}'
ORDER BY company_name, attempt_date DESC
"""

# ── Query G: Score distribution for Walmart + Amazon (AI-assisted) ────────────

QUERY_G = f"""
WITH ai_attempts AS (
    SELECT DISTINCT entity_id AS attempt_id
    FROM starrocks_bizops.analytics.stg_fu_ai_assistant_question
    WHERE entity_type  = 'attempt'
      AND user_msg_cnt > 3
      AND test_id IS NOT NULL
      AND used_date >= DATE '{START_DATE}'
)
SELECT
    rc.name                                                          AS company_name,
    rt.name                                                          AS test_name,
    CAST(FLOOR((CAST(rtc.scaled_percentage_score AS DOUBLE) / 100.0) / 10) * 10 AS INTEGER)       AS bucket_floor,
    CAST(FLOOR((CAST(rtc.scaled_percentage_score AS DOUBLE) / 100.0) / 10) * 10 + 10 AS INTEGER)  AS bucket_ceiling,
    CONCAT(
        CAST(CAST(FLOOR((CAST(rtc.scaled_percentage_score AS DOUBLE)/100.0)/10)*10 AS INTEGER) AS VARCHAR),
        '-',
        CAST(CAST(FLOOR((CAST(rtc.scaled_percentage_score AS DOUBLE)/100.0)/10)*10+10 AS INTEGER) AS VARCHAR),
        '%'
    )                                                                AS score_range,
    COUNT(*)                                                         AS candidate_count
FROM hudi.recruit.recruit_test_candidates rtc
JOIN hudi.recruit.recruit_tests rt
    ON rtc.test_id = rt.id
JOIN hudi.recruit.recruit_companies rc
    ON rt.company_id = rc.id
JOIN ai_attempts ai
    ON CAST(rtc.attempt_id AS VARCHAR) = ai.attempt_id
WHERE rc.id IN {COMPANY_IDS}
  AND rtc.valid = 1
  AND rtc.scaled_percentage_score IS NOT NULL
  AND DATE(rtc.attempt_starttime) >= DATE '{START_DATE}'
GROUP BY
    rc.name,
    rt.name,
    CAST(FLOOR((CAST(rtc.scaled_percentage_score AS DOUBLE)/100.0)/10)*10 AS INTEGER),
    CAST(FLOOR((CAST(rtc.scaled_percentage_score AS DOUBLE)/100.0)/10)*10+10 AS INTEGER)
ORDER BY company_name, test_name, bucket_floor
"""


# ── Post-processing helpers ───────────────────────────────────────────────────

def derive_query_b(rows_c, cols_c):
    """Derive WoW bucket theme breakdown from Query C rows (rating >= 4 only)."""
    idx = {c: i for i, c in enumerate(cols_c)}
    week_buckets = collections.defaultdict(lambda: collections.defaultdict(int))
    week_total   = collections.defaultdict(int)

    bucket_cols = ['content', 'performance', 'ai_assistant', 'uiux', 'core_ide', 'generic', 'others_unmatched']

    for row in rows_c:
        if row[idx['product_rating']] is None:
            continue
        try:
            rating = int(row[idx['product_rating']])
        except (ValueError, TypeError):
            continue
        if rating < 4:
            continue
        week = str(row[idx['attempt_week']])
        week_total[week] += 1
        for bc in bucket_cols:
            if int(row[idx[bc]]):
                week_buckets[week][bc] += 1

    out_cols = ['attempt_week', 'total_positive_feedback'] + bucket_cols
    out_rows = []
    for week in sorted(week_total):
        out_rows.append(
            (week, week_total[week]) + tuple(week_buckets[week].get(bc, 0) for bc in bucket_cols)
        )
    return out_cols, out_rows


def top_verbatims(rows_c, cols_c, n=10):
    """Return top N compelling verbatims from all companies for console display."""
    idx = {c: i for i, c in enumerate(cols_c)}
    candidates = []
    for row in rows_c:
        text = row[idx['raw_feedback_text']]
        if not text or len(text.strip()) < 30:
            continue
        try:
            rating = int(row[idx['product_rating']]) if row[idx['product_rating']] is not None else 0
        except (ValueError, TypeError):
            rating = 0
        candidates.append((rating, len(text), row))

    # Sort: rating desc, then length desc (longer = more informative)
    candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)

    # De-duplicate by company to ensure variety
    seen_companies = set()
    selected = []
    for _, _, row in candidates:
        co = row[idx['company_name']]
        if co not in seen_companies or len(selected) >= n * 2:
            seen_companies.add(co)
            selected.append(row)
        if len(selected) >= n:
            break

    return selected, idx


# ── Console output ────────────────────────────────────────────────────────────

def print_separator(title=''):
    width = 72
    if title:
        print(f'\n{"─" * 4} {title} {"─" * (width - 6 - len(title))}')
    else:
        print('─' * width)


def print_table(cols, rows, max_col_width=30):
    if not rows:
        print('  (no data)')
        return
    widths = [min(max_col_width, max(len(str(c)), max(len(str(r[i])[:max_col_width]) for r in rows)))
              for i, c in enumerate(cols)]
    fmt = '  ' + '  '.join(f'{{:<{w}}}' for w in widths)
    print(fmt.format(*[str(c)[:max_col_width] for c in cols]))
    print('  ' + '  '.join('-' * w for w in widths))
    for row in rows:
        print(fmt.format(*[str(v)[:max_col_width] if v is not None else '' for v in row]))


def print_console_summary(
    cols_a, rows_a,
    cols_b, rows_b,
    top_quotes, idx_c,
    cols_e, rows_e,
    cols_g, rows_g,
):
    print('\n' + '=' * 72)
    print('  AI-ASSISTED TEST FEEDBACK SUMMARY')
    print(f'  Period: {START_DATE} → {END_DATE}  |  Generated: {date.today()}')
    print('=' * 72)

    # ── PART 1: Early adopter signal ─────────────────────────────────────────
    print_separator('1. EARLY ADOPTER SIGNAL — WoW Positive DLI (Rating ≥ 4)')
    print_table(cols_a, rows_a[-14:])   # last 14 weeks max

    print_separator('2. POSITIVE SENTIMENT THEMES — WoW Bucket Breakdown (Rating ≥ 4)')
    display_cols_b = ['attempt_week', 'total_positive_feedback',
                      'ai_assistant', 'uiux', 'content', 'core_ide', 'performance', 'others_unmatched']
    display_cols_b_labels = ['Week', 'Total(DLI≥4)',
                              'AI Assist', 'Platform UX', 'Qn Quality', 'IDE/Env', 'Reliability', 'Other']
    # Reorder rows_b to match display_cols_b
    if rows_b:
        b_idx = {c: i for i, c in enumerate(cols_b)}
        remapped = [tuple(row[b_idx[c]] for c in display_cols_b) for row in rows_b]
        print_table(display_cols_b_labels, remapped[-14:])

    # ── PART 1: Curated testimonials ─────────────────────────────────────────
    print_separator('3. CURATED CANDIDATE TESTIMONIALS (All AI-Assisted Tests)')
    for i, row in enumerate(top_quotes, 1):
        company  = row[idx_c['company_name']]
        rating   = row[idx_c['product_rating']]
        text     = row[idx_c['raw_feedback_text']]
        date_val = row[idx_c['attempt_started_date']]
        tags     = tag_verbatim(text)
        print(f'\n  [{i}] {company}  |  Rating: {rating}/5  |  {date_val}')
        for line in textwrap.wrap(f'"{text}"', width=68, initial_indent='      ', subsequent_indent='      '):
            print(line)
        if tags:
            print(f'      Tags: {tags}')

    # ── PART 2: Walmart + Amazon DLI ─────────────────────────────────────────
    print_separator('4. WALMART & AMAZON — DLI Summary per Test')
    print_table(cols_e, rows_e)

    # ── PART 2: Score distribution ────────────────────────────────────────────
    print_separator('5. WALMART & AMAZON — Score Distribution (AI-Assisted Attempts)')
    print_table(cols_g, rows_g)

    print('\n' + '=' * 72)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    conn = get_conn()

    # Part 1
    cols_a, rows_a = run_query(conn, QUERY_A, 'Query A — WoW positive DLI (all companies)')
    save_csv(os.path.join(OUTPUT_DIR, 'ai-assisted-dli-wow.csv'), cols_a, rows_a)

    cols_c, rows_c = run_query(conn, QUERY_C, 'Query C — All feedback verbatims + buckets')
    # Add TA-proof-point tags in Python
    extra_col = 'ta_proof_point_tags'
    cols_c_out = list(cols_c) + [extra_col]
    rows_c_out = [tuple(r) + (tag_verbatim(r[list(cols_c).index('raw_feedback_text')]),) for r in rows_c]
    save_csv(os.path.join(OUTPUT_DIR, 'ai-assisted-verbatims-all.csv'), cols_c_out, rows_c_out)

    cols_b, rows_b = derive_query_b(rows_c, cols_c)
    save_csv(os.path.join(OUTPUT_DIR, 'ai-assisted-bucket-wow.csv'), cols_b, rows_b)

    # Part 2
    cols_d, rows_d = run_query(conn, QUERY_D, 'Query D — AI-assisted tests Walmart+Amazon')
    save_csv(os.path.join(OUTPUT_DIR, 'ai-assisted-tests-walmart-amazon.csv'), cols_d, rows_d)

    cols_e, rows_e = run_query(conn, QUERY_E, 'Query E — DLI per test Walmart+Amazon')
    save_csv(os.path.join(OUTPUT_DIR, 'ai-assisted-dli-by-test.csv'), cols_e, rows_e)

    cols_f, rows_f = run_query(conn, QUERY_F, 'Query F — Remarks Walmart+Amazon')
    save_csv(os.path.join(OUTPUT_DIR, 'ai-assisted-remarks-walmart-amazon.csv'), cols_f, rows_f)

    cols_g, rows_g = run_query(conn, QUERY_G, 'Query G — Score distribution Walmart+Amazon')
    save_csv(os.path.join(OUTPUT_DIR, 'ai-assisted-score-dist.csv'), cols_g, rows_g)

    # Top verbatims from Query C (all companies, for testimonials section)
    top_quotes, idx_c = top_verbatims(rows_c, cols_c, n=10)

    print_console_summary(
        cols_a, rows_a,
        cols_b, rows_b,
        top_quotes, idx_c,
        cols_e, rows_e,
        cols_g, rows_g,
    )


if __name__ == '__main__':
    main()
