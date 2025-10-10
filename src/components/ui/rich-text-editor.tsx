'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette,
  Upload,
  X
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = useCallback((command: string, commandValue?: string) => {
    try {
      document.execCommand(command, false, commandValue);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        insertImageAtCursor(data.url);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const insertImageAtCursor = (url: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      executeCommand('insertImage', url);
    }
    setShowImageDialog(false);
    setImageUrl('');
  };

  const insertImageFromUrl = () => {
    if (imageUrl.trim()) {
      insertImageAtCursor(imageUrl.trim());
    }
  };

  const formatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  const applyTextColor = (color: string) => {
    executeCommand('foreColor', color);
  };

  const applyBackgroundColor = (color: string) => {
    executeCommand('hiliteColor', color);
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 flex flex-wrap gap-2">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-3 mr-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('bold')}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('italic')}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('underline')}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>

        {/* Text Size */}
        <div className="flex gap-1 border-r border-gray-300 pr-3 mr-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('h1')}
            className="h-8 px-2 text-xs font-bold hover:bg-green-100 hover:text-green-600"
            title="Heading 1"
          >
            H1
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('h2')}
            className="h-8 px-2 text-xs font-bold hover:bg-green-100 hover:text-green-600"
            title="Heading 2"
          >
            H2
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('h3')}
            className="h-8 px-2 text-xs font-bold hover:bg-green-100 hover:text-green-600"
            title="Heading 3"
          >
            H3
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('p')}
            className="h-8 px-2 text-xs hover:bg-green-100 hover:text-green-600"
            title="Paragraph"
          >
            P
          </Button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-3 mr-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('insertUnorderedList')}
            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('insertOrderedList')}
            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-3 mr-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('justifyLeft')}
            className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('justifyCenter')}
            className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('justifyRight')}
            className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Text Colors */}
        <div className="flex gap-1 border-r border-gray-300 pr-3 mr-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyTextColor('#000000')}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title="Black Text"
          >
            <div className="w-4 h-4 bg-black rounded"></div>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyTextColor('#dc2626')}
            className="h-8 w-8 p-0 hover:bg-red-100"
            title="Red Text"
          >
            <div className="w-4 h-4 bg-red-600 rounded"></div>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyTextColor('#059669')}
            className="h-8 w-8 p-0 hover:bg-green-100"
            title="Green Text"
          >
            <div className="w-4 h-4 bg-green-600 rounded"></div>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyTextColor('#2563eb')}
            className="h-8 w-8 p-0 hover:bg-blue-100"
            title="Blue Text"
          >
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
          </Button>
        </div>

        {/* Links and Images */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-600"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowImageDialog(true)}
            className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-600"
            title="Insert Image"
          >
            <Image className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-600"
            title="Upload Image"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="imageUrl" className="text-sm font-medium text-blue-900">
              Image URL:
            </Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  insertImageFromUrl();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={insertImageFromUrl}
              disabled={!imageUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Insert
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowImageDialog(false);
                setImageUrl('');
              }}
              className="hover:bg-red-100 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        className={`min-h-[300px] p-6 outline-none ${
          isEditorFocused ? 'ring-2 ring-blue-500 ring-inset' : ''
        } ${!value && !isEditorFocused ? 'text-gray-400' : 'text-gray-900'}`}
        style={{ 
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          lineHeight: '1.6'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Footer with Character Count and Help */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-3 text-sm text-gray-600 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="font-medium">Rich Text Editor</span>
          <span className="text-xs text-gray-500">Use toolbar for formatting • Ctrl+B/I/U for shortcuts</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-white px-2 py-1 rounded border">
            {value.replace(/<[^>]*>/g, '').length} characters
          </span>
          <span className="text-xs bg-white px-2 py-1 rounded border">
            {value.split(/\s+/).filter(word => word.length > 0).length} words
          </span>
        </div>
      </div>
    </div>
  );
}
