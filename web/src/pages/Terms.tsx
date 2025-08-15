import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { PageHeader, Card, CardBody, Input, Button, Table, FormField, Toast, copyToClipboard } from '../components/ui';
import { DocumentTextIcon, PlusIcon, EyeIcon, GlobeAltIcon, ClipboardIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Terms(){
  const [items, setItems] = useState<any[]>([]);
  const [slug, setSlug] = useState('license-terms');
  const [title, setTitle] = useState('Licentievoorwaarden');
        const [html, setHtml] = useState('Schrijf hier de voorwaarden...');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: html,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none dark:prose-invert focus:outline-none',
        style: 'direction: ltr; text-align: left;',
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
  });

  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const load = async () => {
    const res = await fetch(`${API}/terms`, { headers: { Authorization: tokenHeader.Authorization } });
    setItems((await res.json()).items);
  };
  useEffect(()=>{ load(); },[]);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/terms`, { 
        method: 'POST', 
        headers: tokenHeader, 
        body: JSON.stringify({ 
          slug: slug.trim(), 
          title: title.trim(), 
          contentHtml: html, 
          isPublished: published 
        }) 
      });
      
      if (response.ok) {
        load();
                    // Reset form to defaults
            setSlug('license-terms');
            setTitle('Licentievoorwaarden');
            setHtml('Schrijf hier de voorwaarden...');
            setPublished(true);
        setToast({ message: 'Nieuwe versie succesvol gepubliceerd!', type: 'success' });
      } else {
        setToast({ message: 'Er ging iets mis bij het publiceren', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het publiceren', type: 'error' });
    } finally {
      setLoading(false);
    }
  };



  const handleCopyLink = async (item: any) => {
    const link = `${window.location.origin}/#/terms/${item.slug}/${item.version}`;
    try {
      await copyToClipboard(link);
      setToast({ message: 'Link gekopieerd naar klembord!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Kon link niet kopiëren', type: 'error' });
    }
  };

  const handleCopyLatestLink = async () => {
    const link = `${window.location.origin}/#/terms/latest`;
    try {
      await copyToClipboard(link);
      setToast({ message: 'Link naar laatste versie gekopieerd!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Kon link niet kopiëren', type: 'error' });
    }
  };





  return (
    <div className="space-y-8">
      <PageHeader 
        title="Voorwaarden" 
        subtitle="Beheer licentievoorwaarden en maak nieuwe versies"
      />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Editor sectie */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg">
                <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nieuwe versie aanmaken</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="URL Slug">
                  <Input 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    placeholder="license-terms"
                  />
                </FormField>
                
                <FormField label="Titel">
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Licentievoorwaarden"
                  />
                </FormField>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="published"
                  checked={published} 
                  onChange={(e) => setPublished(e.target.checked)} 
                  className="rounded text-blue-600"
                />
                <label htmlFor="published" className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <GlobeAltIcon className="h-4 w-4" />
                  Direct publiceren
                </label>
              </div>
              
              <FormField label="Inhoud (WYSIWYG Editor)">
                <div className="border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden">
                  
                  {/* TipTap Toolbar */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-2 flex flex-wrap gap-1">
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold ${editor?.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                    >
                      B
                    </button>
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 italic ${editor?.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                    >
                      I
                    </button>
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 underline ${editor?.isActive('underline') ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    >
                      U
                    </button>
                    <div className="w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                      H2
                    </button>
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    >
                      H3
                    </button>
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor?.isActive('paragraph') ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().setParagraph().run()}
                    >
                      P
                    </button>
                    <div className="w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor?.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    >
                      • List
                    </button>
                    <button 
                      type="button"
                      className={`px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor?.isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    >
                      1. List
                    </button>
                  </div>

                  {/* TipTap Editor */}
                  <div className="p-4 min-h-[300px] focus:bg-blue-50/20 dark:focus:bg-blue-950/20">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </FormField>
              
              <div className="flex justify-end">
                <Button 
                  variant="primary" 
                  icon={PlusIcon}
                  onClick={handlePublish}
                  disabled={loading}
                >
                  {loading ? 'Publiceren...' : 'Nieuwe versie publiceren'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

                    {/* Versies lijst */}
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Bestaande versies</h2>
                  </div>
                  {items.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={ClipboardIcon}
                      onClick={handleCopyLatestLink}
                    >
                      Kopieer laatste versie link
                    </Button>
                  )}
                </div>
            
            <Table>
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Versie</th>
                  <th>Status</th>
                  <th>Laatst gewijzigd</th>
                  <th className="text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.title}</td>
                    <td>
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 font-mono">
                        v{item.version}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        item.isPublished 
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-950/50 dark:text-gray-300'
                      }`}>
                        {item.isPublished ? 'Gepubliceerd' : 'Concept'}
                      </span>
                    </td>
                    <td className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={ClipboardIcon}
                          onClick={() => handleCopyLink(item)}
                          title="Kopieer link naar klembord"
                        >
                          Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={EyeIcon}
                          onClick={() => window.open(`/#/terms/${item.slug}/${item.version}`, '_blank')}
                          title="Bekijk deze versie in nieuw tabblad"
                        >
                          Bekijken
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {items.length === 0 && (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                <p>Nog geen voorwaarden aangemaakt</p>
                <p className="text-sm">Maak links uw eerste versie aan</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
