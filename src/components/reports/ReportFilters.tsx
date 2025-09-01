
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, File, X } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { ReportFormat } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { getCategories } from '@/services/categoryService';
import { Category } from '@/types/categories';
import CategoryIcon from '@/components/categories/CategoryIcon';

interface ReportFiltersProps {
  reportType: string;
  setReportType: (type: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  onDownload: (format: ReportFormat) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  setReportType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedCategories,
  setSelectedCategories,
  onDownload
}) => {
  const { t } = usePreferences();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    };
    loadCategories();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('reports.filters')}</CardTitle>
        <CardDescription>{t('reports.filtersDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('reports.reportType')}</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('reports.selectReportType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('reports.allTransactions')}</SelectItem>
                <SelectItem value="income">{t('reports.incomeOnly')}</SelectItem>
                <SelectItem value="expenses">{t('reports.expensesOnly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('reports.startDate')}</label>
            <DatePicker date={startDate} setDate={setStartDate} />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium">{t('reports.endDate')}</label>
            <DatePicker date={endDate} setDate={setEndDate} />
          </div>
        </div>

        {/* Category Filter Section */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium">{t('reports.categories')}</label>
            {selectedCategories.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllCategories}>
                <X className="h-4 w-4 mr-1" />
                {t('reports.clearAll')}
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Select onValueChange={handleCategoryToggle}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('reports.selectCategories')} />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    disabled={selectedCategories.includes(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={category.icon} color={category.color} size={16} />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((categoryId) => {
                  const category = categories.find(c => c.id === categoryId);
                  if (!category) return null;
                  
                  return (
                    <Badge
                      key={categoryId}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      <CategoryIcon icon={category.icon} color={category.color} size={12} />
                      <span className="text-xs">{category.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1 hover:bg-transparent"
                        onClick={() => handleCategoryToggle(categoryId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onDownload('csv')}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FileText className="h-4 w-4" />
            {t('reports.downloadCSV')}
          </Button>
          <Button 
            onClick={() => onDownload('pdf')}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <File className="h-4 w-4" />
            {t('reports.downloadPDF')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
