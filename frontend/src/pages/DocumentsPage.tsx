// pages/DocumentsPage.tsx
import React, { useState, useRef, useEffect } from 'react'
import { deleteDocument, getDocuments, getDocumentUrl } from '../api/clients'
import type { Document } from '../api/types'

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await getDocuments()
      setDocuments(response.data)
    } catch (err) {
      console.error('Load error:', err)
      setError('Не удалось загрузить документы')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 10MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      await loadDocuments()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки файла')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = (doc: Document) => {
    const fileUrl = `http://localhost${getDocumentUrl(doc.filename)}`
    window.location.href = fileUrl
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот документ?')) return
    try {
      await deleteDocument(id)
      await loadDocuments()
    } catch (err) {
      setError('Ошибка удаления файла')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-[#F8F9FF] min-h-screen">
      {/* Заголовок и кнопка */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-[41px] sm:mb-4 md:mb-[5px]">
        <h1 className="text-xl sm:text-2xl md:text-[32px] font-bold text-[#0B1C30]">
          Документы
        </h1>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
        />

        <button
          onClick={handleFileUpload}
          disabled={isUploading}
          className="flex items-center justify-center text-[12px] sm:text-[14px] md:text-[16px] gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-[3px] bg-[#287233] hover:bg-[#047857] text-white rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <svg className="flex-shrink-0" width="14" height="10" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.58915 13.687C4.73334 13.687 3.1712 13.0127 1.90272 11.6642C0.634241 10.3156 0 8.70402 0 6.82938C0 4.95473 0.634241 3.34784 1.90272 2.00871C3.1712 0.669568 4.73334 0 6.58915 0H16.15C17.5037 0 18.6439 0.489314 19.5707 1.46794C20.4975 2.44657 20.9609 3.62212 20.9609 4.99459C20.9609 6.36706 20.4975 7.5379 19.5707 8.50711C18.6439 9.47632 17.5037 9.96092 16.15 9.96092H7.10328C6.25183 9.96092 5.53352 9.65421 4.94838 9.0408C4.36323 8.42739 4.07066 7.69025 4.07066 6.82938C4.07066 5.9685 4.36323 5.23607 4.94838 4.63208C5.53352 4.02809 6.25183 3.7261 7.10328 3.7261H16.3533V6.23482H7.10328C6.94314 6.23482 6.81343 6.29152 6.71416 6.40493C6.61488 6.51833 6.56525 6.65981 6.56525 6.82938C6.56525 6.99894 6.61253 7.14513 6.70709 7.26796C6.80165 7.39078 6.93372 7.4522 7.10328 7.4522H16.1359C16.7982 7.44495 17.3522 7.20147 17.7979 6.72176C18.2435 6.24205 18.4663 5.66633 18.4663 4.99459C18.4663 4.32285 18.2459 3.74061 17.8049 3.24785C17.364 2.7551 16.8124 2.50872 16.15 2.50872H6.58915C5.42466 2.50148 4.45111 2.9263 3.6685 3.78318C2.88589 4.64007 2.49459 5.66018 2.49459 6.84351C2.49459 8.0196 2.88589 9.03246 3.6685 9.8821C4.45111 10.7317 5.42466 11.1638 6.58915 11.1783H16.8903V13.687H6.58915Z" fill="white"/>
          </svg>
          <span className="hidden sm:inline md:hidden">Файл</span>
          <span className="sm:hidden">{isUploading ? '...' : 'Файл'}</span>
          <span className="hidden md:inline">{isUploading ? 'Загрузка...' : 'Прикрепить файл'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center text-[11px] sm:text-[12px] md:text-[14px]">
          <span className="flex-1 mr-2">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 flex-shrink-0">✕</button>
        </div>
      )}

      {/* Таблица документов */}
      <div className="overflow-hidden">
        {/* Заголовок таблицы */}
        <div className="grid grid-cols-12 gap-1 sm:gap-2 md:gap-4 px-2 sm:px-3 md:px-6 lg:px-[71px] py-2 sm:py-3 bg-[#F8F9FF] text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wide">
          <div className="col-span-6">Название</div>
          <div className="col-span-2">Размер</div>
          <div className="col-span-4">Дата</div>
        </div>

        <div className="rounded-lg bg-white divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-[12px] sm:text-[14px]">
              Загрузка...
            </div>
          ) : documents.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
              <svg width="32" height="32" sm-width="40" sm-height="40" md-width="48" md-height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 sm:mb-3 md:mb-4 text-gray-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <p className="text-[13px] sm:text-[15px] md:text-[17px] font-medium">Нет документов</p>
              <p className="text-[11px] sm:text-[12px] md:text-[14px] mt-1">Загрузите первый документ</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="grid grid-cols-12 gap-1 sm:gap-2 md:gap-4 px-2 sm:px-3 md:px-6 py-2.5 sm:py-3 md:py-4 hover:bg-[#F8FAFC] transition-colors group">
                <div className="col-span-6 flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0">
                  <div className="flex-shrink-0 w-[40px] h-[40px] sm:w-9 sm:h-9 md:w-12 md:h-12 bg-[#E0E7FF] rounded-lg flex items-center justify-center">
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 16H12V14H4V16ZM4 12H12V10H4V12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H10L16 6V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 7V2H2V18H14V7H9ZM2 2V7V2V7V18V2Z" fill="#2563EB"/>
</svg>

                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-[#0B1C30] truncate" title={doc.original_name || doc.filename}>
                      {doc.original_name || doc.filename || 'Без названия'}
                    </h3>
                    {doc.description && (
                      <p className="text-[10px] sm:text-[11px] md:text-[12px] text-[#64748B] truncate mt-0.5 hidden sm:block">{doc.description}</p>
                    )}
                  </div>
                </div>

                <div className="col-span-2 flex items-center text-[11px] sm:text-[12px] md:text-[14px] text-[#64748B] whitespace-nowrap">
                  {formatFileSize(doc.size)}
                </div>

                <div className="col-span-4 flex items-center justify-between gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] md:text-[14px] text-[#64748B] whitespace-nowrap">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                  </span>
                  
                  <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button 
                      onClick={() => handleDownload(doc)} 
                      className="p-1 sm:p-1.5 md:p-2 text-[#047857] hover:bg-[#ECFDF5] rounded-lg transition-colors" 
                      title="Скачать"
                    >
                      <svg width="12" height="12" sm-width="14" sm-height="14" md-width="18" md-height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(doc.id)} 
                      className="p-1 sm:p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                      title="Удалить"
                    >
                      <svg width="12" height="12" sm-width="14" sm-height="14" md-width="18" md-height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentsPage