import React, { useState } from 'react';
import { format, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Calendar, 
  User, 
  Users, 
  Clock, 
  ChevronDown, 
  MessageCircle,
  Cigarette,
  CigaretteOff,
  PartyPopper,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Room, EventType, EVENT_TYPES } from '../types';
import { supabase } from '../lib/supabase';

const WHATSAPP_NUMBER = "3884935856";

export default function BookingForm() {
  const [formData, setFormData] = useState({
    date: '',
    tableName: '',
    peopleCount: '',
    hour: '20',
    minute: '00',
    room: 'non-fumatori' as Room,
    event: '' as EventType | '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dayOfWeek = formData.date ? getDay(new Date(formData.date)) : -1;
  
  const availableEvents = EVENT_TYPES.filter(event => {
    if (event.includes('Quizzami')) return dayOfWeek === 4;
    if (event.includes('Serata Italiana')) return dayOfWeek === 5;
    if (event.includes('DJ set')) return dayOfWeek === 6;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const time = `${formData.hour}:${formData.minute}`;
    const reservationData = {
      date: formData.date,
      tableName: formData.tableName,
      peopleCount: parseInt(formData.peopleCount),
      time: time,
      room: formData.room,
      event: formData.event || 'Mangiare e bere',
      notes: formData.notes,
    };

    try {
      // 1. Send to Supabase (Silent)
      const { error } = await supabase
        .from('reservations')
        .insert([reservationData]);

      if (error) throw error;

      // 2. Prepare WhatsApp Message
      const message = `Ciao! Vorrei prenotare un tavolo per il Red Lion Pub:%0A%0A` +
        `📅 *Data:* ${format(new Date(formData.date), 'dd/MM/yyyy')}%0A` +
        `👤 *Nome:* ${formData.tableName}%0A` +
        `👥 *Persone:* ${formData.peopleCount}%0A` +
        `⏰ *Orario:* ${time}%0A` +
        `📍 *Sala:* ${formData.room.toUpperCase()}%0A` +
        `🎉 *Motivo:* ${formData.event || 'Mangiare e bere'}%0A` +
        `📝 *Note:* ${formData.notes || 'Nessuna'}`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
      
      // Redirect to WhatsApp
      window.location.href = whatsappUrl;
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting reservation:', error);
      alert('Si è verificato un errore. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Richiesta Inviata!</h2>
          <p className="text-gray-400">Verrai reindirizzato a WhatsApp per confermare la prenotazione.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-serif italic font-bold text-[#D4AF37] mb-2">RED LION PUB</h1>
          <p className="text-gray-400 text-sm">Prenota il tuo tavolo in pochi click</p>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-tighter leading-tight">
              ATTENZIONE: LA PRENOTAZIONE SARA' EFFETTIVA SOLO DOPO LA NOSTRA CONFERMA TRAMITE WHATSAPP!
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data */}
          <div>
            <label className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mb-2">
              <Calendar size={16} /> Data
            </label>
            <input 
              required
              type="date"
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Nome del tavolo */}
          <div>
            <label className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mb-2">
              <User size={16} /> Nome del tavolo
            </label>
            <input 
              required
              type="text"
              placeholder="Es. Mario Rossi"
              value={formData.tableName}
              onChange={e => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Numero persone */}
          <div>
            <label className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mb-2">
              <Users size={16} /> Numero persone
            </label>
            <input 
              required
              type="number"
              min="1"
              placeholder="Es. 4"
              value={formData.peopleCount}
              onChange={e => setFormData(prev => ({ ...prev, peopleCount: e.target.value }))}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Orario */}
          <div>
            <label className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mb-2">
              <Clock size={16} /> Orario
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <select 
                  value={formData.hour}
                  onChange={e => setFormData(prev => ({ ...prev, hour: e.target.value }))}
                  className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-[#D4AF37]"
                >
                  {[18, 19, 20, 21, 22].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="relative flex-1">
                <select 
                  value={formData.minute}
                  onChange={e => setFormData(prev => ({ ...prev, minute: e.target.value }))}
                  className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-[#D4AF37]"
                >
                  {['00', '30'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-gray-500 italic">
              Massimo orario di prenotazione ore 22:30, se arrivi dopo chiamaci al 3884935856
            </p>
          </div>

          {/* Sala */}
          <div>
            <label className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mb-2">
              <Cigarette size={16} /> Sala
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, room: 'non-fumatori' }))}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all",
                  formData.room === 'non-fumatori' 
                    ? "bg-white/10 border-white/20 text-white" 
                    : "bg-[#1E1E1E] border-white/5 text-gray-500"
                )}
              >
                <CigaretteOff size={16} className={formData.room === 'non-fumatori' ? "text-red-500" : ""} />
                Non Fumatori
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, room: 'fumatori' }))}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all",
                  formData.room === 'fumatori' 
                    ? "bg-white/10 border-white/20 text-white" 
                    : "bg-[#1E1E1E] border-white/5 text-gray-500"
                )}
              >
                <Cigarette size={16} className={formData.room === 'fumatori' ? "text-gray-300" : ""} />
                Fumatori
              </button>
            </div>
          </div>

          {/* Vengo per... */}
          <div>
            <label className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mb-2">
              <PartyPopper size={16} /> Vengo per...
            </label>
            <div className="relative">
              <select 
                required
                value={formData.event}
                onChange={e => setFormData(prev => ({ ...prev, event: e.target.value as EventType }))}
                className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="" disabled>Seleziona motivo...</option>
                {availableEvents.map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mb-2">
              <FileText size={16} /> Note (Facoltativo)
            </label>
            <textarea 
              placeholder="Altre richieste..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors h-24 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            disabled={isSubmitting}
            type="submit"
            className={cn(
              "w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 rounded-full transition-all transform active:scale-95 shadow-lg shadow-green-500/20",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          >
            <MessageCircle size={24} />
            {isSubmitting ? 'INVIO IN CORSO...' : 'INVIA SU WHATSAPP'}
          </button>
        </form>

        <footer className="mt-12 text-center text-gray-600 text-[10px] uppercase tracking-widest">
          Red Lion Pub &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
