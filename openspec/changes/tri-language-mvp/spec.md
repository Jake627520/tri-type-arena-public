# Normative specification (SHALL)
## US-001 Choose language
Given idle session, when user selects EN/Pinyin/Zhuyin, app SHALL display matching text and expected phonetic input; changing mode SHALL reset the session.
## US-002 Timed session
Given duration 30/60/120, when START, app SHALL start countdown. When deadline passes, input SHALL be disabled and result displayed. RESTART SHALL clear session counters.
## US-003 Exact match
When typed normalized input equals expected input, completion SHALL advance one lesson, increment word counter and combo. Prefix mismatch SHALL visually flag error and require correction.
## US-004 Input mapping
Pinyin SHALL ignore accent marks and case. Zhuyin SHALL map physical Daqian keys; first tone implicit, 6=ˊ, 3=ˇ, 4=ˋ, 7=˙. Composition interim events SHALL not be evaluated.
## US-005 Score
Accuracy SHALL equal correct newly entered input keys / total newly entered input keys. WPM SHALL equal correct keys / 5 / elapsed minutes, 0 if elapsed=0. Best score SHALL be persisted locally by mode upon finish.
## US-006 Trust and isolation
App SHALL function without network calls. No untrusted HTML SHALL be rendered as markup. History SHALL not leave the browser.
