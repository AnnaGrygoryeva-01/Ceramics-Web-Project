# Turns the lines of an env file into one JSON object. Run with `jq -Rn -f`. When a
# key repeats the last line wins, so put the file that takes priority last.
#
# Values are read literally, so a $ stays a $. Each value has to fit on one line.

def parse_value:
  sub("^\\s+"; "")
  | . as $raw
  | [capture("^(?<quote>[\"'`])(?<body>.*?)\\k<quote>\\s*(#.*)?$")] as $quoted
  | if $quoted == [] then $raw | sub("\\s*#.*$"; "") | sub("\\s+$"; "")
    elif $quoted[0].quote == "\"" then $quoted[0].body | gsub("\\\\n"; "\n")
    else $quoted[0].body
    end;

reduce (
  inputs
  | sub("\r$"; "")
  | sub("^\\s*(export\\s+)?"; "")
  | select(test("^[A-Za-z_][A-Za-z0-9_]*\\s*="))
  | capture("^(?<key>[^=\\s]+)\\s*=(?<value>.*)$")
) as $line ({}; .[$line.key] = ($line.value | parse_value))
