import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfDay, addDays, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Users, 
  Cigarette, 
  CigaretteOff, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Reservation, Room, EventType, ROOM_CAPACITIES, EVENT_TYPES } from '../types';
import { supabase } from '../lib/supabase';

export default function AdminAgenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Reservation>>({
    tableName: '',
    peopleCount: 1,
    tableNumber: '',
    time: '20:00',
    room: 'non-fumatori',
    event: 'Mangiare e bere',
    notes: '',
  });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchReservations = async (date: string) => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true });
    
    if (error) console.error('Error fetching:', error);
    else setReservations(data || []);
  };

  useEffect(() => {
    fetchReservations(dateStr);

    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => fetchReservations(dateStr)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateStr]);

  const stats = useMemo(() => {
    const smoking = reservations.filter(r => r.room === 'fumatori').reduce((acc, r) => acc + r.peopleCount, 0);
    const nonSmoking = reservations.filter(r => r.room === 'non-fumatori').reduce((acc, r) => acc + r.peopleCount, 0);
    const total = smoking + nonSmoking;
    
    const early = reservations.filter(r => {
      const hour = parseInt(r.time.split(':')[0]);
      return hour >= 18 && hour < 21;
    }).reduce((acc, r) => acc + r.peopleCount, 0);

    const late = reservations.filter(r => {
      const hour = parseInt(r.time.split(':')[0]);
      return hour >= 21;
    }).reduce((acc, r) => acc + r.peopleCount, 0);

    return { total, smoking, nonSmoking, early, late };
  }, [reservations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('reservations')
      .insert([{ ...formData, date: dateStr }]);

    if (error) {
      alert('Errore nel salvataggio');
    } else {
      setIsModalOpen(false);
      setFormData({
        tableName: '',
        peopleCount: 1,
        tableNumber: '',
        time: '20:00',
        room: 'non-fumatori',
        event: 'Mangiare e bere',
        notes: '',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa prenotazione?')) return;
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);
    
    if (error) alert('Errore nella cancellazione');
  };

  const handlePrint = () => {
    window.print();
  };

  const dayOfWeek = getDay(selectedDate);
  const availableEvents = EVENT_TYPES.filter(event => {
    if (event.includes('Quizzami')) return dayOfWeek === 4;
    if (event.includes('Serata Italiana')) return dayOfWeek === 5;
    if (event.includes('DJ set')) return dayOfWeek === 6;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif italic font-bold tracking-tight mb-1">Agenda Red Lion Pub</h1>
          <p className="text-sm text-black/50 uppercase tracking-widest font-semibold flex items-center gap-2">
            <CalendarIcon size={14} />
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedDate(prev => addDays(prev, -1))}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-white border border-black/10 rounded-full text-sm font-medium hover:bg-black/5 transition-colors"
          >
            Oggi
          </button>
          <button 
            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
          <button 
            onClick={handlePrint}
            className="p-2 bg-white border border-black/10 rounded-full hover:bg-black/5 transition-colors ml-2"
            title="Stampa giornata"
          >
            <Printer size={20} />
          </button>
        </div>
      </header>

      {/* Stats Dashboard */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 print:hidden">
        <StatCard 
          label="Totale Prenotati" 
          value={stats.total} 
          max={ROOM_CAPACITIES.fumatori + ROOM_CAPACITIES['non-fumatori']} 
          icon={<Users size={18} />}
        />
        <StatCard 
          label="Sala Fumatori" 
          value={stats.smoking} 
          max={ROOM_CAPACITIES.fumatori} 
          icon={<Cigarette size={18} />}
          color="bg-orange-500"
        />
        <StatCard 
          label="Sala Non Fumatori" 
          value={stats.nonSmoking} 
          max={ROOM_CAPACITIES['non-fumatori']} 
          icon={<CigaretteOff size={18} />}
          color="bg-emerald-600"
        />
        <StatCard 
          label="Fascia 18:00 - 21:00" 
          value={stats.early} 
          icon={<Clock size={18} />}
          color="bg-blue-500"
        />
        <StatCard 
          label="Fascia 21:00+" 
          value={stats.late} 
          icon={<Clock size={18} />}
          color="bg-indigo-600"
        />
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
          <div className="p-6 border-bottom border-black/5 flex items-center justify-between">
            <h2 className="text-xl font-serif italic font-semibold">Prenotazioni</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#141414] text-white px-6 py-2.5 rounded-full hover:bg-black/80 transition-all transform active:scale-95 print:hidden"
            >
              <Plus size={18} />
              Nuova Prenotazione
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.02] text-[11px] uppercase tracking-widest font-bold text-black/40">
                  <th className="px-6 py-4">Orario</th>
                  <th className="px-6 py-4">Nome Tavolo</th>
                  <th className="px-6 py-4">Persone</th>
                  <th className="px-6 py-4">Tavolo #</th>
                  <th className="px-6 py-4">Sala</th>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4 text-right print:hidden">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                <AnimatePresence mode="popLayout">
                  {reservations.length === 0 ? (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={8} className="px-6 py-12 text-center text-black/30 italic">
                        Nessuna prenotazione per oggi
                      </td>
                    </motion.tr>
                  ) : (
                    reservations.map((res) => (
                      <motion.tr 
                        key={res.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group hover:bg-black/[0.01] transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm font-semibold">{res.time}</td>
                        <td className="px-6 py-4 font-medium">{res.tableName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 text-xs font-bold">
                            <Users size={12} />
                            {res.peopleCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-black/40 font-mono">{res.tableNumber || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border",
                            res.room === 'fumatori' ? "border-orange-200 text-orange-700 bg-orange-50" : "border-emerald-200 text-emerald-700 bg-emerald-50"
                          )}>
                            {res.room}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm italic font-serif">{res.event}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-black/60 truncate" title={res.notes}>
                            {res.notes || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right print:hidden">
                          <button 
                            onClick={() => res.id && handleDelete(res.id)}
                            className="p-2 text-black/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-serif italic font-bold mb-6">Nuova Prenotazione</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Nome Tavolo</label>
                      <input 
                        required
                        type="text"
                        value={formData.tableName}
                        onChange={e => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all"
                        placeholder="es. Rossi"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Persone</label>
                      <input 
                        required
                        type="number"
                        min="1"
                        value={formData.peopleCount}
                        onChange={e => setFormData(prev => ({ ...prev, peopleCount: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Tavolo # (opz)</label>
                      <input 
                        type="text"
                        value={formData.tableNumber}
                        onChange={e => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all"
                        placeholder="es. 12"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Orario</label>
                      <div className="flex items-center gap-2">
                        <select 
                          value={formData.time?.split(':')[0] || '20'}
                          onChange={e => {
                            const mins = formData.time?.split(':')[1] || '00';
                            setFormData(prev => ({ ...prev, time: `${e.target.value}:${mins}` }));
                          }}
                          className="flex-1 px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all appearance-none"
                        >
                          {[18, 19, 20, 21, 22, 23, '00', '01', '02'].map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="font-bold">:</span>
                        <select 
                          value={formData.time?.split(':')[1] || '00'}
                          onChange={e => {
                            const hour = formData.time?.split(':')[0] || '20';
                            setFormData(prev => ({ ...prev, time: `${hour}:${e.target.value}` }));
                          }}
                          className="flex-1 px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all appearance-none"
                        >
                          {['00', '30'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Sala</label>
                      <select 
                        value={formData.room}
                        onChange={e => setFormData(prev => ({ ...prev, room: e.target.value as Room }))}
                        className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all appearance-none"
                      >
                        <option value="non-fumatori">Non Fumatori</option>
                        <option value="fumatori">Fumatori</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Evento</label>
                      <select 
                        value={formData.event}
                        onChange={e => setFormData(prev => ({ ...prev, event: e.target.value as EventType }))}
                        className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all appearance-none"
                      >
                        {availableEvents.map(ev => (
                          <option key={ev} value={ev}>{ev}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Note</label>
                      <textarea 
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black/10 transition-all h-24 resize-none"
                        placeholder="Specifiche partita, DJ, o altro..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 bg-black/5 text-black font-semibold rounded-2xl hover:bg-black/10 transition-all"
                    >
                      Annulla
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-3 bg-[#141414] text-white font-semibold rounded-2xl hover:bg-black/80 transition-all"
                    >
                      Salva
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; padding: 0; }
          .print\\:hidden { display: none !important; }
          .max-w-6xl { max-width: 100%; margin: 0; }
          .bg-white { box-shadow: none; border: none; }
          table { font-size: 12px; }
          th, td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, max, icon, color = "bg-black" }: { label: string, value: number, max?: number, icon: React.ReactNode, color?: string }) {
  const percentage = max ? Math.round(Math.min((value / max) * 100, 100)) : 0;

  return (
    <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-black/30">{icon}</span>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-mono font-bold">
            {value}{max ? <span className="text-sm text-black/20 font-normal">/{max}</span> : ''}
          </span>
          {max && <span className="text-[10px] font-bold text-black/30">{percentage}%</span>}
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">{label}</p>
      {max && (
        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={cn("h-full rounded-full", color)}
          />
        </div>
      )}
    </div>
  );
}
