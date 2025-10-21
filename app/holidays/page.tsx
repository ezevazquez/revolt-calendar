"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Briefcase, CheckSquare, Square, Loader2, Trash2, ExternalLink } from "lucide-react"
import { type Holiday } from "@/lib/sanity"
import { useToast } from "@/components/ui/toast"

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedHolidays, setSelectedHolidays] = useState<Set<string>>(new Set())
  const [selectedAllHolidays, setSelectedAllHolidays] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, status: '' })
  const [scrapeYear, setScrapeYear] = useState('2025')
  const { addToast } = useToast()

  // Cargar automáticamente todos los feriados al entrar a la página
  useEffect(() => {
    loadAllHolidaysFromDB()
  }, [])

  const loadAllHolidaysFromDB = async () => {
    try {
      const response = await fetch('/api/get-all-holidays', {
        method: 'GET',
      })
      const result = await response.json()
      
      if (result.success) {
        setAllHolidays(result.holidays)
        // Filtrar solo los pending para la columna izquierda
        const pendingHolidays = result.holidays.filter((h: Holiday) => h.status === 'pending')
        setHolidays(pendingHolidays)
      }
    } catch (error) {
      console.error('Error loading holidays from DB:', error)
    }
  }


  const scrapeHolidays = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/scrape-holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year: scrapeYear, temporary: true }),
      })
      const result = await response.json()
      
      if (result.success) {
        // Los feriados scrapedos se muestran temporalmente en la izquierda
        setHolidays(result.holidays)
               addToast({
                 type: 'success',
                 title: 'API fetch successful',
                 message: result.stats 
                   ? `Found ${result.stats.total} holidays: ${result.stats.new} new, ${result.stats.existing} already exist`
                   : `Found ${result.holidays.length} holidays from ArgentinaDatos API to review`
               })
      } else {
        addToast({
          type: 'error',
          title: 'API fetch error',
          message: result.message
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not fetch holidays from API'
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectHoliday = (id: string) => {
    const newSelected = new Set(selectedHolidays)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedHolidays(newSelected)
  }

         const toggleSelectAll = () => {
           // Solo considerar feriados que no existen en la DB
           const selectableHolidays = holidays.filter(h => !h.existsInDB)
           const selectedSelectableHolidays = selectableHolidays.filter(h => selectedHolidays.has(h._id))
           
           if (selectedSelectableHolidays.length === selectableHolidays.length) {
             // Si todos los seleccionables están seleccionados, deseleccionar todos
             setSelectedHolidays(new Set())
           } else {
             // Si no todos están seleccionados, seleccionar todos los seleccionables
             setSelectedHolidays(new Set(selectableHolidays.map(h => h._id)))
           }
         }

         const toggleSelectAllHoliday = (id: string) => {
           const newSelected = new Set(selectedAllHolidays)
           if (newSelected.has(id)) {
             newSelected.delete(id)
           } else {
             newSelected.add(id)
           }
           setSelectedAllHolidays(newSelected)
         }

         const toggleSelectAllAll = () => {
           if (selectedAllHolidays.size === allHolidays.length) {
             setSelectedAllHolidays(new Set())
           } else {
             setSelectedAllHolidays(new Set(allHolidays.map(h => h._id)))
           }
         }

         const bulkDeleteHolidays = async () => {
           if (selectedAllHolidays.size === 0) {
             addToast({
               type: 'warning',
               title: 'Selection required',
               message: 'Select at least one holiday to delete'
             })
             return
           }

           setBulkLoading(true)
           try {
             const deleteResponse = await fetch('/api/delete-holidays', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify({ ids: Array.from(selectedAllHolidays) }),
             })
             
             const deleteResult = await deleteResponse.json()
             if (!deleteResult.success) {
               throw new Error(deleteResult.message)
             }
             
             // Actualizar solo la lista de todos los feriados (sección derecha)
             const fetchResponse = await fetch('/api/get-all-holidays', {
               method: 'GET',
             })
             const fetchResult = await fetchResponse.json()
             
             if (fetchResult.success) {
               setAllHolidays(fetchResult.holidays)
               // NO actualizar holidays (sección izquierda) para mantener los feriados temporales
             }
             
             setSelectedAllHolidays(new Set())
             
             addToast({
               type: 'success',
               title: 'Holidays deleted',
               message: `${selectedAllHolidays.size} holidays deleted successfully`
             })
           } catch (error) {
             addToast({
               type: 'error',
               title: 'Error',
               message: 'Could not delete holidays'
             })
             console.error(error)
           } finally {
             setBulkLoading(false)
           }
         }

         const deleteAllHolidays = async () => {
           if (allHolidays.length === 0) {
             addToast({
               type: 'warning',
               title: 'No holidays',
               message: 'No holidays to delete'
             })
             return
           }

           // Confirmación
           const confirmed = window.confirm(
             `Are you sure you want to delete ALL ${allHolidays.length} holidays? This action cannot be undone.`
           )
           
           if (!confirmed) return

           setBulkLoading(true)
           setBulkProgress({ current: 0, total: allHolidays.length, status: 'Deleting all holidays...' })
           
           try {
             const deleteResponse = await fetch('/api/delete-all-holidays', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
               },
             })
             
             const deleteResult = await deleteResponse.json()
             if (!deleteResult.success) {
               throw new Error(deleteResult.message)
             }
             
             // Simular progreso
             for (let i = 0; i <= allHolidays.length; i++) {
               setBulkProgress({ 
                 current: i, 
                 total: allHolidays.length, 
                 status: 'Deleting all holidays...' 
               })
               await new Promise(resolve => setTimeout(resolve, 50))
             }
             
             // Limpiar estados
             setAllHolidays([])
             setSelectedAllHolidays(new Set())
             
             addToast({
               type: 'success',
               title: 'All holidays deleted',
               message: `${deleteResult.deletedCount} holidays deleted successfully`
             })
           } catch (error) {
             addToast({
               type: 'error',
               title: 'Error',
               message: 'Could not delete all holidays'
             })
             console.error(error)
           } finally {
             setBulkLoading(false)
             setBulkProgress({ current: 0, total: 0, status: '' })
           }
         }

         const bulkUpdateStatus = async (status: 'approved' | 'working' | 'rejected') => {
           if (selectedHolidays.size === 0) {
             addToast({
               type: 'warning',
               title: 'Selection required',
               message: 'Select at least one holiday'
             })
             return
           }

           setBulkLoading(true)
           setBulkProgress({ current: 0, total: 0, status: 'Preparing...' })
           
           try {
             // Solo procesar feriados que no existen en la DB (evitar duplicados)
             const selectedHolidayObjects = holidays.filter(h => 
               selectedHolidays.has(h._id) && !h.existsInDB
             )
             
             if (selectedHolidayObjects.length === 0) {
               addToast({
                 type: 'warning',
                 title: 'No new holidays selected',
                 message: 'All selected holidays already exist in database'
               })
               setBulkLoading(false)
               setBulkProgress({ current: 0, total: 0, status: '' })
               return
             }

             setBulkProgress({ current: 0, total: selectedHolidayObjects.length, status: 'Saving holidays...' })
      
             if (status === 'approved' || status === 'working') {
               // Solo guardar en Sanity los aprobados o marcados como working
               const response = await fetch('/api/save-approved-holidays', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({ holidays: selectedHolidayObjects, status }),
               })
               
               const result = await response.json()
               if (!result.success) {
                 throw new Error(result.message)
               }
               
               setBulkProgress({ current: selectedHolidayObjects.length, total: selectedHolidayObjects.length, status: 'Updating database...' })
               
               // Actualizar la lista de todos los feriados
               await loadAllHolidaysFromDB()
             }
             
             setBulkProgress({ current: selectedHolidayObjects.length, total: selectedHolidayObjects.length, status: 'Completing...' })
             
             // Simular progreso paso a paso
             for (let i = 0; i <= selectedHolidayObjects.length; i++) {
               setBulkProgress({ 
                 current: i, 
                 total: selectedHolidayObjects.length, 
                 status: i === selectedHolidayObjects.length ? 'Completing...' : 'Saving holidays...' 
               })
               await new Promise(resolve => setTimeout(resolve, 100)) // Pequeña pausa para ver el progreso
             }
           
           // Remover de la lista temporal (izquierda)
           setHolidays(holidays.filter(h => !selectedHolidays.has(h._id)))
           setSelectedHolidays(new Set())
           
           addToast({
             type: 'success',
             title: 'Holidays processed',
             message: `${selectedHolidayObjects.length} new holidays ${status === 'rejected' ? 'rejected' : 'saved to database'}`
           })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not process holidays'
      })
      console.error(error)
    } finally {
      setBulkLoading(false)
      setBulkProgress({ current: 0, total: 0, status: '' })
    }
  }

         const getStatusIcon = (status: string) => {
           switch (status) {
             case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
             case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
             case 'working': return <Briefcase className="w-4 h-4 text-orange-500" />
             case 'custom': return <Briefcase className="w-4 h-4 text-purple-500" />
             case 'existing': return <CheckCircle className="w-4 h-4 text-blue-500" />
             default: return <Clock className="w-4 h-4 text-yellow-500" />
           }
         }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inamovible': return 'bg-red-500 text-white'
      case 'trasladable': return 'bg-orange-500 text-white'
      case 'no_laborable': return 'bg-blue-500 text-white'
      case 'custom': return 'bg-purple-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con link al CMS */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Holiday management</h1>
          <Link 
            href="/admin" 
            target="_blank"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Go to CMS
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">
          <div className="lg:border-r lg:border-slate-700/50 lg:pr-8">
          {/* Columna Izquierda: Scraping y Gestión */}
          <div className="space-y-6">
            <div className="flex items-center justify-between py-5">
              <h2 className="text-xl font-semibold text-slate-200">Import</h2>
              <div className="flex gap-3 items-center">
                <input
                  id="scrape-year"
                  type="number"
                  min="2016"
                  max="2025"
                  value={scrapeYear}
                  onChange={(e) => setScrapeYear(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24"
                  placeholder="2025"
                />
                <Button onClick={scrapeHolidays} disabled={loading} size="sm">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch Holidays"
                  )}
                </Button>
              </div>
            </div>
            
            {holidays.length > 0 && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 h-16 flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleSelectAll}
                      disabled={bulkLoading}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {(() => {
                        const selectableHolidays = holidays.filter(h => !h.existsInDB)
                        const selectedSelectableHolidays = selectableHolidays.filter(h => selectedHolidays.has(h._id))
                        
                        if (selectedSelectableHolidays.length === selectableHolidays.length && selectableHolidays.length > 0) {
                          return (
                            <>
                              <Square className="w-4 h-4 mr-1" />
                              Deselect All
                            </>
                          )
                        } else {
                          return (
                            <>
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Select All
                            </>
                          )
                        }
                      })()}
                    </Button>
                    <span className="text-sm text-slate-400">
                      {selectedHolidays.size} of {holidays.filter(h => !h.existsInDB).length}
                    </span>
                  </div>
                  
                  {selectedHolidays.size > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => bulkUpdateStatus('approved')}
                        disabled={bulkLoading}
                        className="bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => bulkUpdateStatus('working')}
                        disabled={bulkLoading}
                        className="bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600"
                      >
                        <Briefcase className="w-4 h-4 mr-1" />
                        Work
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => bulkUpdateStatus('rejected')}
                        disabled={bulkLoading}
                        className="bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
                     {holidays.map((holiday) => (
                       <Card 
                         key={holiday._id} 
                         className={`p-4 transition-colors relative ${
                           holiday.existsInDB
                             ? 'bg-slate-900/40 border-slate-600/30 opacity-60'
                             : selectedHolidays.has(holiday._id) 
                             ? 'bg-slate-700/50 border-slate-600' 
                             : 'bg-slate-800/60 border-slate-700/50'
                         }`}
                       >
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => !holiday.existsInDB && toggleSelectHoliday(holiday._id)}
                        disabled={holiday.existsInDB || bulkLoading}
                        className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors flex-shrink-0 ${
                          holiday.existsInDB
                            ? 'border-slate-600 cursor-not-allowed opacity-50'
                            : 'border-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {selectedHolidays.has(holiday._id) && (
                          <CheckSquare className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(holiday.status || 'pending')}
                            <h3 className="font-semibold">
                              {holiday.name}
                            </h3>
                          </div>
                          <Badge className={holiday.existsInDB ? 'bg-blue-500 text-white' : getTypeColor(holiday.type || 'custom')}>
                            {holiday.existsInDB ? 'Already in DB' : holiday.type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Date:</span> {new Date(holiday.startDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {holiday.existsInDB ? 'Already in Database' : (holiday.status || 'pending')}
                          </div>
                        </div>
                        {holiday.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {holidays.length === 0 && !loading && (
                <Card className="p-8 text-center">
                        <p className="text-muted-foreground">
                          No pending holidays to review.
                        </p>
                </Card>
              )}
            </div>
          </div>
          </div>

          {/* Columna Derecha: Todos los Feriados de la DB */}
          <div className="lg:pl-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between py-5">
              <h2 className="text-xl font-semibold text-slate-200">Current holidays</h2>
              <span className="text-sm text-slate-400 bg-slate-700/50 px-3 py-2 rounded h-10 flex items-center">
                {allHolidays.length} total
              </span>
            </div>
            
                   {allHolidays.length > 0 && (
                     <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 h-16 flex items-center">
                       <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-4">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={toggleSelectAllAll}
                             disabled={bulkLoading}
                             className="border-slate-600 text-slate-300 hover:bg-slate-700"
                           >
                             {selectedAllHolidays.size === allHolidays.length ? (
                               <>
                                 <Square className="w-4 h-4 mr-1" />
                                 Deselect All
                               </>
                             ) : (
                               <>
                                 <CheckSquare className="w-4 h-4 mr-1" />
                                 Select All
                               </>
                             )}
                           </Button>
                           <span className="text-sm text-slate-400">
                             {selectedAllHolidays.size} of {allHolidays.length}
                           </span>
                         </div>
                         
                         <div className="flex gap-2">
                           {selectedAllHolidays.size > 0 && (
                             <Button
                               size="sm"
                               onClick={bulkDeleteHolidays}
                               disabled={bulkLoading}
                               className="bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600"
                             >
                               <Trash2 className="w-4 h-4 mr-1" />
                               Delete
                             </Button>
                           )}
                           <Button
                             size="sm"
                             onClick={deleteAllHolidays}
                             disabled={bulkLoading}
                             className="bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700"
                           >
                             <Trash2 className="w-4 h-4 mr-1" />
                             Delete All
                           </Button>
                         </div>
                       </div>
                     </div>
                   )}
            
            <div className="space-y-4">
              {allHolidays.map((holiday) => (
                <Card 
                  key={holiday._id} 
                  className={`p-4 transition-colors ${
                    selectedAllHolidays.has(holiday._id) 
                      ? 'bg-slate-700/50 border-slate-600' 
                      : 'bg-slate-800/60 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleSelectAllHoliday(holiday._id)}
                        disabled={bulkLoading}
                        className="flex items-center justify-center w-5 h-5 rounded border-2 border-slate-400 hover:border-slate-300 transition-colors flex-shrink-0"
                      >
                        {selectedAllHolidays.has(holiday._id) && (
                          <CheckSquare className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      {getStatusIcon(holiday.status || 'pending')}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 
                            className="font-semibold truncate max-w-[200px]" 
                          >
                            {holiday.name.length > 20 ? `${holiday.name.substring(0, 20)}...` : holiday.name}
                          </h3>
                          <Badge className={holiday.existsInDB ? 'bg-blue-500 text-white' : getTypeColor(holiday.type || 'custom')}>
                            {holiday.existsInDB ? 'Already in DB' : holiday.type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Date:</span> {new Date(holiday.startDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {holiday.existsInDB ? 'Already in Database' : (holiday.status || 'pending')}
                          </div>
                        </div>
                        {holiday.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {allHolidays.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No holidays in database yet.
                  </p>
                </Card>
              )}
            </div>
          </div>
               </div>
             </div>
           </div>
           
           {/* Full-page loading overlay */}
           {bulkLoading && bulkProgress.total > 0 && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
               <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 border border-slate-600">
                 <div className="text-center space-y-6">
                   {/* Spinner */}
                   <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                   
                   {/* Status */}
                   <div>
                     <h3 className="text-lg font-semibold text-white mb-2">Processing Holidays</h3>
                     <p className="text-slate-300">{bulkProgress.status}</p>
                   </div>
                   
                   {/* Progress */}
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm text-slate-400">
                       <span>Progress</span>
                       <span>{bulkProgress.current} / {bulkProgress.total}</span>
                     </div>
                     <div className="w-full bg-slate-700 rounded-full h-3">
                       <div 
                         className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                         style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                       ></div>
                     </div>
                     <div className="text-xs text-slate-500">
                       {Math.round((bulkProgress.current / bulkProgress.total) * 100)}% complete
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}
         </div>
       )
     }
