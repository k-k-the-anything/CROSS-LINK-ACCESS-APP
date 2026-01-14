import React, { useState } from 'react';
import {
    Plus,
    Star,
    StarOff,
    Edit2,
    Trash2,
    Copy,
    FileText,
    Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useTemplateStore, useAppStore, usePostStore } from '../../stores';
import type { PostTemplate } from '../../types';
import { cn } from '../../lib/utils';

// Template card component
const TemplateCard: React.FC<{
    template: PostTemplate;
    onEdit: () => void;
    onDelete: () => void;
    onUse: () => void;
    onToggleFavorite: () => void;
}> = ({ template, onEdit, onDelete, onUse, onToggleFavorite }) => {
    const { language } = useAppStore();

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
                        {template.name}
                    </h3>
                    <button
                        onClick={onToggleFavorite}
                        className={cn(
                            'p-1 rounded transition-colors',
                            template.isFavorite
                                ? 'text-yellow-500'
                                : 'text-gray-400 hover:text-yellow-500'
                        )}
                    >
                        {template.isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                    </button>
                </div>

                {template.description && (
                    <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                )}

                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                    {template.content}
                </p>

                {template.hashtags && template.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {template.hashtags.slice(0, 3).map((tag, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded text-xs"
                            >
                                <Hash size={10} />
                                {tag}
                            </span>
                        ))}
                        {template.hashtags.length > 3 && (
                            <span className="text-xs text-gray-400">+{template.hashtags.length - 3}</span>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                        {language === 'ja' ? `${template.useCount}回使用` : `Used ${template.useCount} times`}
                    </span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={onUse} title={language === 'ja' ? '使用' : 'Use'}>
                            <Copy size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onEdit} title={language === 'ja' ? '編集' : 'Edit'}>
                            <Edit2 size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            className="text-red-500 hover:text-red-600"
                            title={language === 'ja' ? '削除' : 'Delete'}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Template form component
const TemplateForm: React.FC<{
    template?: PostTemplate;
    onSave: (data: Omit<PostTemplate, 'id' | 'useCount'>) => void;
    onCancel: () => void;
}> = ({ template, onSave, onCancel }) => {
    const { language } = useAppStore();
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [content, setContent] = useState(template?.content || '');
    const [hashtagsInput, setHashtagsInput] = useState(template?.hashtags?.join(', ') || '');

    const t = {
        ja: {
            title: template ? 'テンプレートを編集' : '新規テンプレート',
            name: 'テンプレート名',
            namePlaceholder: '例：商品紹介用',
            description: '説明（任意）',
            descriptionPlaceholder: '用途や使用シーンなど',
            content: '本文',
            contentPlaceholder: '投稿の本文を入力...',
            hashtags: 'ハッシュタグ（カンマ区切り）',
            hashtagsPlaceholder: '例：新商品, おすすめ, PR',
            save: '保存',
            cancel: 'キャンセル',
        },
        en: {
            title: template ? 'Edit Template' : 'New Template',
            name: 'Template Name',
            namePlaceholder: 'e.g., Product Introduction',
            description: 'Description (optional)',
            descriptionPlaceholder: 'Usage or scenarios',
            content: 'Content',
            contentPlaceholder: 'Enter post content...',
            hashtags: 'Hashtags (comma-separated)',
            hashtagsPlaceholder: 'e.g., newproduct, recommended, ad',
            save: 'Save',
            cancel: 'Cancel',
        },
    };

    const labels = t[language];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !content.trim()) return;

        const hashtags = hashtagsInput
            .split(',')
            .map((tag) => tag.trim().replace(/^#/, ''))
            .filter((tag) => tag.length > 0);

        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            content: content.trim(),
            hashtags: hashtags.length > 0 ? hashtags : undefined,
            isFavorite: template?.isFavorite || false,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{labels.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{labels.name}</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={labels.namePlaceholder}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{labels.description}</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={labels.descriptionPlaceholder}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{labels.content}</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={labels.contentPlaceholder}
                            rows={5}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{labels.hashtags}</label>
                        <Input
                            value={hashtagsInput}
                            onChange={(e) => setHashtagsInput(e.target.value)}
                            placeholder={labels.hashtagsPlaceholder}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            {labels.cancel}
                        </Button>
                        <Button type="submit">{labels.save}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

// Main TemplateManager component
export const TemplateManager: React.FC = () => {
    const { templates, addTemplate, updateTemplate, deleteTemplate, toggleFavorite, incrementUseCount } = useTemplateStore();
    const { setDraftContent, setDraftHashtags } = usePostStore();
    const { language, setCurrentView } = useAppStore();

    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PostTemplate | null>(null);
    const [filter, setFilter] = useState<'all' | 'favorites'>('all');

    const t = {
        ja: {
            title: 'テンプレート',
            description: '投稿テンプレートを作成・管理します',
            newTemplate: '新規テンプレート',
            noTemplates: 'テンプレートがありません',
            noTemplatesDesc: 'よく使う投稿内容をテンプレートとして保存しましょう',
            all: 'すべて',
            favorites: 'お気に入り',
        },
        en: {
            title: 'Templates',
            description: 'Create and manage post templates',
            newTemplate: 'New Template',
            noTemplates: 'No templates yet',
            noTemplatesDesc: 'Save frequently used content as templates',
            all: 'All',
            favorites: 'Favorites',
        },
    };

    const labels = t[language];

    const filteredTemplates = filter === 'favorites'
        ? templates.filter((t) => t.isFavorite)
        : templates;

    const handleSaveTemplate = (data: Omit<PostTemplate, 'id' | 'useCount'>) => {
        if (editingTemplate) {
            updateTemplate(editingTemplate.id, data);
        } else {
            addTemplate(data);
        }
        setShowForm(false);
        setEditingTemplate(null);
    };

    const handleUseTemplate = (template: PostTemplate) => {
        setDraftContent(template.content);
        if (template.hashtags) {
            setDraftHashtags(template.hashtags);
        }
        incrementUseCount(template.id);
        setCurrentView('compose');
    };

    if (showForm || editingTemplate) {
        return (
            <div className="animate-fade-in">
                <TemplateForm
                    template={editingTemplate || undefined}
                    onSave={handleSaveTemplate}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingTemplate(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h2>
                    <p className="text-gray-500 mt-1">{labels.description}</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus size={16} className="mr-2" />
                    {labels.newTemplate}
                </Button>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        'px-4 py-2 text-sm rounded-lg transition-colors',
                        filter === 'all'
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                >
                    {labels.all}
                </button>
                <button
                    onClick={() => setFilter('favorites')}
                    className={cn(
                        'px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1',
                        filter === 'favorites'
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                >
                    <Star size={14} />
                    {labels.favorites}
                </button>
            </div>

            {/* Templates grid */}
            {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={() => setEditingTemplate(template)}
                            onDelete={() => deleteTemplate(template.id)}
                            onUse={() => handleUseTemplate(template)}
                            onToggleFavorite={() => toggleFavorite(template.id)}
                        />
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="font-medium text-gray-900 dark:text-white">{labels.noTemplates}</h3>
                        <p className="text-sm text-gray-500 mt-1">{labels.noTemplatesDesc}</p>
                        <Button onClick={() => setShowForm(true)} className="mt-4">
                            <Plus size={16} className="mr-2" />
                            {labels.newTemplate}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
