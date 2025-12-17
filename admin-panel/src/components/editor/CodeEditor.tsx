'use client';

import React, { useRef, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'html' | 'css' | 'json' | 'javascript';
  height?: string;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Code Editor Component
 * Monaco editor wrapper for HTML/CSS editing
 */
export function CodeEditor({
  value,
  onChange,
  language,
  height = '400px',
  readOnly = false,
  placeholder,
  className = '',
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure HTML language features
    if (language === 'html') {
      monaco.languages.html.htmlDefaults.setOptions({
        format: {
          tabSize: 2,
          insertSpaces: true,
          wrapLineLength: 120,
          unformatted: 'code,pre,em,strong',
        },
        suggest: {
          html5: true,
        },
      });
    }

    // Configure CSS language features
    if (language === 'css') {
      monaco.languages.css.cssDefaults.setOptions({
        validate: true,
        lint: {
          compatibleVendorPrefixes: 'warning',
          vendorPrefix: 'warning',
          duplicateProperties: 'warning',
          emptyRules: 'warning',
          importStatement: 'warning',
          boxModel: 'warning',
          universalSelector: 'warning',
          zeroUnits: 'warning',
        },
      });
    }

    // Focus editor
    editor.focus();
  }, [language]);

  const handleChange: OnChange = useCallback((value) => {
    onChange(value || '');
  }, [onChange]);

  // Get Monaco theme based on system preference
  const getTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs';
    }
    return 'vs';
  };

  // Language mapping for Monaco
  const languageMap: Record<string, string> = {
    html: 'html',
    css: 'css',
    json: 'json',
    javascript: 'javascript',
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <Editor
        height={height}
        defaultLanguage={languageMap[language] || 'html'}
        language={languageMap[language] || 'html'}
        value={value}
        theme={getTheme()}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineHeight: 22,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          folding: true,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          padding: {
            top: 10,
            bottom: 10,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="animate-pulse text-gray-500">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}

export default CodeEditor;
