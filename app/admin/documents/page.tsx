'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/admin/file-upload';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2, PlayCircle, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface UploadedDocument {
  id: string;
  filename: string;
  file_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  target_subcategory_id?: string;
  error_message?: string;
  created_at: string;
  processed_at?: string;
  metadata?: {
    title?: string;
    chunk_count?: number;
  };
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export default function DocumentsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { toast } = useToast();

  // Fetch categories and subcategories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents/upload');
      if (!response.ok) throw new Error('Failed to fetch documents');

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
    fetchDocuments();
  }, [fetchCategories, fetchDocuments]);

  // Auto-refresh documents during processing
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    if (!documentTitle) {
      // Auto-populate title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setDocumentTitle(nameWithoutExt);
    }
  }, [documentTitle]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSubcategoryId) {
      toast({
        title: 'Error',
        description: 'Please select a subcategory',
        variant: 'destructive',
      });
      return;
    }

    if (!documentTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for the content',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('subcategoryId', selectedSubcategoryId);
      formData.append('title', documentTitle.trim());

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      // Reset form
      setSelectedFile(null);
      setDocumentTitle('');
      setSelectedSubcategoryId('');

      // Refresh documents
      await fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async (documentId: string) => {
    setProcessingIds((prev) => new Set(prev).add(documentId));

    try {
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Processing failed');
      }

      toast({
        title: 'Processing Started',
        description: 'Document is being processed',
      });

      // Refresh documents
      await fetchDocuments();
    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to process document',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also delete the associated content item and embeddings.')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      // Refresh documents
      await fetchDocuments();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const getSubcategoryName = (subcategoryId: string): string => {
    for (const category of categories) {
      const subcategory = category.subcategories.find((s) => s.id === subcategoryId);
      if (subcategory) return `${category.name} / ${subcategory.name}`;
    }
    return 'Unknown';
  };

  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter === 'all') return true;
    return doc.status === statusFilter;
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Management</h1>
        <p className="text-gray-600">
          Upload and process documents to add them to the knowledge base
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or Markdown files to be processed and added to the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Content Title *</Label>
            <Input
              id="title"
              placeholder="Enter a title for this content"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Target Subcategory *</Label>
            <Select value={selectedSubcategoryId} onValueChange={setSelectedSubcategoryId} disabled={isUploading}>
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <div key={category.id}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                      {category.name}
                    </div>
                    {category.subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File Upload *</Label>
            <FileUpload onFileSelect={handleFileSelect} disabled={isUploading} />
          </div>

          <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedSubcategoryId || !documentTitle.trim()} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Documents List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Uploaded Documents</h2>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {statusFilter === 'all' ? 'No documents uploaded yet' : `No ${statusFilter} documents`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <h3 className="text-lg font-semibold truncate">
                          {doc.metadata?.title || doc.filename}
                        </h3>
                        <StatusBadge status={doc.status} />
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Filename:</span> {doc.filename}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span> {doc.file_type.toUpperCase()}
                        </p>
                        {doc.target_subcategory_id && (
                          <p>
                            <span className="font-medium">Location:</span>{' '}
                            {getSubcategoryName(doc.target_subcategory_id)}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Uploaded:</span>{' '}
                          {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                        {doc.processed_at && (
                          <p>
                            <span className="font-medium">Processed:</span>{' '}
                            {format(new Date(doc.processed_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                        {doc.metadata?.chunk_count && (
                          <p>
                            <span className="font-medium">Chunks:</span> {doc.metadata.chunk_count}
                          </p>
                        )}
                        {doc.error_message && (
                          <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm">{doc.error_message}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {doc.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcess(doc.id)}
                          disabled={processingIds.has(doc.id)}
                        >
                          {processingIds.has(doc.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Process
                            </>
                          )}
                        </Button>
                      )}
                      {doc.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcess(doc.id)}
                          disabled={processingIds.has(doc.id)}
                        >
                          {processingIds.has(doc.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            'Retry'
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(doc.id)}
                        disabled={doc.status === 'processing'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
