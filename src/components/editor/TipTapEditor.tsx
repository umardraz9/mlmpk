'use client'

import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Eraser
} from 'lucide-react'

interface TipTapEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export default function TipTapEditor({ value, onChange, placeholder, className }: TipTapEditorProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ 
        placeholder: placeholder || 'Start typing your product description...',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[20rem] p-4 text-gray-900 leading-relaxed',
        style: 'white-space: pre-wrap;'
      },
    },
    onCreate: ({ editor }) => {
      // Ensure editor is focusable
      editor.view.dom.setAttribute('contenteditable', 'true')
      editor.view.dom.setAttribute('tabindex', '0')
    }
  }, [placeholder])

  // Sync external value changes
  useEffect(() => {
    if (editor && mounted) {
      const currentContent = editor.getHTML()
      if (value !== currentContent) {
        editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
      }
    }
  }, [value, editor, mounted])

  if (!mounted) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex flex-wrap gap-1 p-2 border-b bg-white/70 backdrop-blur-sm rounded-t-xl">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="border-2 border-teal-200 rounded-b-xl bg-white/70 backdrop-blur-sm min-h-[20rem] flex items-center justify-center">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      </div>
    )
  }

  if (!editor) {
    return (
      <div className={cn('w-full', className)}>
        <div className="border-2 border-red-200 rounded-xl bg-red-50 p-4 text-center">
          <div className="text-red-600">Editor failed to load. Please refresh the page.</div>
        </div>
      </div>
    )
  }

  const toggleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt('Enter URL')
    if (!url) return
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Image URL')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const Button = ({
    onClick,
    active,
    label,
    children,
  }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center h-9 px-2 rounded-md text-sm border transition-colors',
        active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      )}
    >
      {children}
    </button>
  )

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-white/70 backdrop-blur-sm rounded-t-xl">
        <Button label="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button label="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button label="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
          <Heading3 className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold className="w-4 h-4" />
        </Button>
        <Button label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic className="w-4 h-4" />
        </Button>
        <Button label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button label="Strike" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
          <Strikethrough className="w-4 h-4" />
        </Button>
        <Button label="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
          <Quote className="w-4 h-4" />
        </Button>
        <Button label="Code Block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
          <Code className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button label="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List className="w-4 h-4" />
        </Button>
        <Button label="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button label="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button label="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button label="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button label="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })}>
          <AlignJustify className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button label="Link" onClick={toggleLink} active={editor.isActive('link')}>
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button label="Image" onClick={addImage}>
          <ImageIcon className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button label="Clear Marks" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
          <Eraser className="w-4 h-4" />
        </Button>
      </div>
      <div className="border-2 border-teal-200 rounded-b-xl bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all duration-200">
        <EditorContent 
          editor={editor} 
          className="min-h-[20rem] cursor-text"
          onClick={() => editor?.commands.focus()}
        />
      </div>
    </div>
  )
}
