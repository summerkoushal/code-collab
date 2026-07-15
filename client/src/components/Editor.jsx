import React, { useEffect, useRef } from 'react'
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";

export default function Editor({ socketRef, roomId }) {
    const editorRef = useRef(null);
    useEffect(() => {
        const init = async () => {
            const editor = CodeMirror.fromTextArea(document.getElementById('realTimeEditor'), {
                  mode: { name: 'javascript', json: true }, 
                  theme: 'dracula',
                  autoCloseTags: true,
                  autoCloseBrackets: true,
                  lineNumbers: true,
                }
            )
          editorRef.current = editor;
            editor.setSize(null, '100%');
          editor.on('change', (instance, changes) => {
            // console.log(`changes`, instance, changes);
            const { origin } = changes;
            const code = instance.getValue();
            if (origin != 'setValue') {
              socketRef.current.emit('code-change', {
                roomId,
                code,
              });
            }
          })
        }
        init();
    }, [])
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("code-change", ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }
    return () => {
      socketRef.current.off('code-change');
    }
  }, [socketRef.current])

  return (
    <div style={{ height: "100%" }}>
      <textarea id="realTimeEditor"></textarea>
    </div>
  );
}
