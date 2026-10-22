package themes

import (
	"testing"
)

// @covers AC-PLUGINS-THEMES-002.1
func TestConvertVSCodeJSONC(t *testing.T) {
	data := []byte(`{ // a real exported palette
 "name":"Example","type":"dark",
 "colors":{"editor.background":"#272822","editor.foreground":"#f8f8f2","unknown.id":"bad"},
 "tokenColors":[{"name":"Comments","scope":["comment","string"],"settings":{"foreground":"#a6e22e","fontStyle":"italic"}},],
 "semanticTokenColors":{"variable.readonly":{"foreground":"#f92672","bold":true}},
 }`)
	imported, err := ConvertVSCode(data, "")
	if err != nil {
		t.Fatal(err)
	}
	if imported.Definition.UI["background"] != "#272822" || imported.Definition.Syntax["comment"].Foreground != "#a6e22e" || imported.Report.Ignored != 1 {
		t.Fatalf("conversion = %+v", imported)
	}
	if imported.Definition.Semantic["variable.readonly"].FontStyle != "bold" {
		t.Fatal("semantic style lost")
	}
	again, err := ConvertVSCode(data, "")
	if err != nil {
		t.Fatal(err)
	}
	if imported.ID != again.ID {
		t.Fatal("identity unstable")
	}
}

func TestConvertVSCodeRejectsInvalidInputs(t *testing.T) {
	for _, data := range []string{`{"type":"dark","include":"./other.json"}`, `{"type":"dark","tokenColors":"./rules.json"}`, `{"type":"hcBlack"}`, `{"colors":{}}`, `{"type":"dark","colors":{"editor.background":"url(bad)"}}`, `{"type":"dark","colors":{"editor.background":"#fff","editor.background":"#000"}}`} {
		if _, err := ConvertVSCode([]byte(data), ""); err == nil {
			t.Errorf("accepted %s", data)
		}
	}
}
