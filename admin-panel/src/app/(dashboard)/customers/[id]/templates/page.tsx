'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Copy,
  Eye,
  Code2,
  FileCode2,
  Palette,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  Modal,
  ModalFooter,
  LoadingOverlay,
} from '@/components/ui';
import { CodeEditor } from '@/components/editor';
import { customersService, templatesService } from '@/services';
import { formatDate, cn } from '@/lib/utils';
import type { Customer, CustomTemplate } from '@/types';

// ========================================
// Tab Types
// ========================================

type EditorTab = 'html' | 'css' | 'data' | 'preview';

interface EditorTabItem {
  id: EditorTab;
  label: string;
  icon: React.ReactNode;
}

const editorTabs: EditorTabItem[] = [
  { id: 'html', label: 'HTML', icon: <Code2 className="h-4 w-4" /> },
  { id: 'css', label: 'CSS', icon: <Palette className="h-4 w-4" /> },
  { id: 'data', label: 'Data Schema', icon: <FileCode2 className="h-4 w-4" /> },
  { id: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> },
];

// ========================================
// Main Component
// ========================================

export default function TemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('html');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Editor state
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [dataSchemaContent, setDataSchemaContent] = useState('{}');
  const [defaultDataContent, setDefaultDataContent] = useState('{}');

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [customerData, templatesData] = await Promise.all([
        customersService.getById(customerId),
        templatesService.getByCustomer(customerId),
      ]);

      setCustomer(customerData);
      setTemplates(templatesData);

      // Select first template if available
      if (templatesData.length > 0 && !selectedTemplate) {
        loadTemplate(templatesData[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yuklenirken hata olustu');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load template into editor
  const loadTemplate = (template: CustomTemplate) => {
    setSelectedTemplate(template);
    setHtmlContent(template.htmlTemplate || '');
    setCssContent(template.cssStyles || '');
    setDataSchemaContent(JSON.stringify(template.dataSchema || {}, null, 2));
    setDefaultDataContent(JSON.stringify(template.defaultData || {}, null, 2));
    setActiveTab('html');
  };

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Template adi gerekli');
      return;
    }

    setIsSaving(true);
    try {
      const newTemplate = await templatesService.create(customerId, {
        name: newTemplateName,
        htmlTemplate: templatesService.getSampleHtml(),
        cssStyles: templatesService.getSampleCss(),
        dataSchema: templatesService.getSampleDataSchema(),
        defaultData: templatesService.getSampleDefaultData(),
      });

      toast.success('Template olusturuldu');
      setIsCreateModalOpen(false);
      setNewTemplateName('');
      await fetchData();
      loadTemplate(newTemplate);
    } catch (error: any) {
      toast.error(error.message || 'Template olusturulamadi');
    } finally {
      setIsSaving(false);
    }
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    // Validate JSON
    let dataSchema = {};
    let defaultData = {};

    try {
      dataSchema = JSON.parse(dataSchemaContent);
    } catch {
      toast.error('Data Schema gecersiz JSON formati');
      return;
    }

    try {
      defaultData = JSON.parse(defaultDataContent);
    } catch {
      toast.error('Default Data gecersiz JSON formati');
      return;
    }

    setIsSaving(true);
    try {
      await templatesService.update(selectedTemplate.id, {
        htmlTemplate: htmlContent,
        cssStyles: cssContent,
        dataSchema,
        defaultData,
      });

      toast.success('Template kaydedildi');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Kaydetme basarisiz');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (template: CustomTemplate) => {
    if (!confirm(`"${template.name}" template'ini silmek istediginize emin misiniz?`)) return;

    try {
      await templatesService.delete(template.id);
      toast.success('Template silindi');

      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
        setHtmlContent('');
        setCssContent('');
        setDataSchemaContent('{}');
        setDefaultDataContent('{}');
      }

      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Silme basarisiz');
    }
  };

  // Duplicate template
  const handleDuplicateTemplate = async (template: CustomTemplate) => {
    try {
      const duplicated = await templatesService.duplicate(template.id);
      toast.success('Template kopyalandi');
      fetchData();
      loadTemplate(duplicated);
    } catch (error: any) {
      toast.error(error.message || 'Kopyalama basarisiz');
    }
  };

  // Render preview
  const renderPreview = () => {
    let parsedData = {};
    try {
      parsedData = JSON.parse(defaultDataContent);
    } catch {
      // Ignore parse errors
    }

    // Simple template rendering for preview
    let previewHtml = htmlContent;

    // Replace simple variables
    Object.entries(parsedData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      previewHtml = previewHtml.replace(regex, String(value));
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          :root {
            --pwx-primary-color: #007bff;
            --pwx-secondary-color: #6c757d;
            --pwx-font-family: Inter, sans-serif;
          }
          body {
            margin: 0;
            padding: 20px;
            font-family: Inter, sans-serif;
          }
          ${cssContent}
        </style>
      </head>
      <body>
        ${previewHtml}
      </body>
      </html>
    `;
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!customer) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Musteri bulunamadi</p>
        <Link href="/customers">
          <Button variant="outline">Musterilere Don</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/customers/${customerId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Template Editor</h1>
            <Badge variant="info">{customer.name}</Badge>
          </div>
          <p className="mt-1 text-gray-500">Ozel widget template&apos;leri olusturun ve duzenleyin</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Yeni Template
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Template List Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Template&apos;ler</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      'group flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50',
                      selectedTemplate?.id === template.id && 'bg-primary-50 hover:bg-primary-50'
                    )}
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        selectedTemplate?.id === template.id ? 'text-primary-700' : 'text-gray-900'
                      )}>
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(template.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(template);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Kopyala"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <FileCode2 className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">
                      Henuz template yok
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Ilk Template&apos;i Olustur
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor Area */}
        <div className="col-span-9">
          {selectedTemplate ? (
            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>
                      {selectedTemplate.description || 'Template icerigini duzenleyin'}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleSaveTemplate}
                    isLoading={isSaving}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Kaydet
                  </Button>
                </div>

                {/* Editor Tabs */}
                <div className="mt-4 border-b border-gray-200">
                  <nav className="-mb-px flex gap-4">
                    {editorTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        )}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {/* HTML Editor */}
                {activeTab === 'html' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">HTML Template</label>
                      <span className="text-xs text-gray-500">
                        Handlebars syntax: {'{{variable}}'}, {'{{#each items}}'}...{'{{/each}}'}
                      </span>
                    </div>
                    <CodeEditor
                      value={htmlContent}
                      onChange={setHtmlContent}
                      language="html"
                      height="500px"
                    />
                  </div>
                )}

                {/* CSS Editor */}
                {activeTab === 'css' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">CSS Styles</label>
                      <span className="text-xs text-gray-500">
                        CSS variables: --pwx-primary-color, --pwx-font-family
                      </span>
                    </div>
                    <CodeEditor
                      value={cssContent}
                      onChange={setCssContent}
                      language="css"
                      height="500px"
                    />
                  </div>
                )}

                {/* Data Schema Editor */}
                {activeTab === 'data' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-700">Data Schema</label>
                        <p className="text-xs text-gray-500">Template degiskenleri ve tipleri</p>
                      </div>
                      <CodeEditor
                        value={dataSchemaContent}
                        onChange={setDataSchemaContent}
                        language="json"
                        height="450px"
                      />
                    </div>
                    <div>
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-700">Default Data</label>
                        <p className="text-xs text-gray-500">Varsayilan degerler</p>
                      </div>
                      <CodeEditor
                        value={defaultDataContent}
                        onChange={setDefaultDataContent}
                        language="json"
                        height="450px"
                      />
                    </div>
                  </div>
                )}

                {/* Preview */}
                {activeTab === 'preview' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Canli Onizleme</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('preview')}
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                      >
                        Yenile
                      </Button>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <iframe
                        srcDoc={renderPreview()}
                        className="w-full h-[500px] border-0"
                        title="Template Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      * Onizleme basitlestirilmis template rendering kullanir. Gercek widget urun verileri ve
                      tum helper fonksiyonlari icerecektir.
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t bg-gray-50">
                <div className="flex items-center justify-between w-full text-sm text-gray-500">
                  <span>
                    Olusturulma: {formatDate(selectedTemplate.createdAt)}
                  </span>
                  <span>
                    Son guncelleme: {formatDate(selectedTemplate.updatedAt)}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <FileCode2 className="mx-auto h-16 w-16 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">
                  Template Secin veya Olusturun
                </p>
                <p className="mt-2 text-gray-500">
                  Sol taraftan bir template secin veya yeni bir tane olusturun
                </p>
                <Button
                  className="mt-6"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Yeni Template Olustur
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewTemplateName('');
        }}
        title="Yeni Template Olustur"
      >
        <div className="space-y-4">
          <Input
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            label="Template Adi"
            placeholder="Ornek: Yaz Kampanyasi Banner"
          />
          <p className="text-sm text-gray-500">
            Yeni template ornek HTML/CSS ve data schema ile olusturulacak.
            Daha sonra istediginiz gibi duzenleyebilirsiniz.
          </p>
        </div>
        <ModalFooter className="-mx-6 -mb-4 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreateModalOpen(false);
              setNewTemplateName('');
            }}
          >
            Iptal
          </Button>
          <Button onClick={handleCreateTemplate} isLoading={isSaving}>
            Olustur
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
