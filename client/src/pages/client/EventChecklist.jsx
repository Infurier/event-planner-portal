import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineLightBulb, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getApiErrorMessage, validateChecklistTask } from '../../utils/validation';

const EventChecklist = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    API.get('/events').then(r => {
      const ev = r.data.events || [];
      setEvents(ev);
      if (ev.length > 0) setSelectedEvent(ev[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    setLoadingSuggestions(true);
    API.get(`/events/${selectedEvent}/suggested-checklist`)
      .then(r => setSuggestions(r.data.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, [selectedEvent, events]);

  const event = events.find(e => e.id == selectedEvent);
  const checklist = event?.checklist || [];
  const completed = checklist.filter(c => c.completed).length;

  const existingTasksLower = checklist.map(c => c.task?.toLowerCase().trim());
  const filteredSuggestions = suggestions.filter(
    s => !existingTasksLower.includes(s.task?.toLowerCase().trim())
  );

  const toggleItem = async (index) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    try {
      await API.put(`/events/${selectedEvent}/checklist`, { checklist: updated });
      setEvents(events.map(e => e.id == selectedEvent ? { ...e, checklist: updated } : e));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update checklist'));
    }
  };

  const removeItem = async (index) => {
    const updated = checklist.filter((_, i) => i !== index);
    try {
      await API.put(`/events/${selectedEvent}/checklist`, { checklist: updated });
      setEvents(events.map(e => e.id == selectedEvent ? { ...e, checklist: updated } : e));
      toast.success('Task removed.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update checklist'));
    }
  };

  const addItem = async (task) => {
    const taskError = validateChecklistTask(task);
    if (taskError) {
      toast.error(taskError);
      return;
    }
    const updated = [...checklist, { task: task.trim(), completed: false }];
    try {
      await API.put(`/events/${selectedEvent}/checklist`, { checklist: updated });
      setEvents(events.map(e => e.id == selectedEvent ? { ...e, checklist: updated } : e));
      setNewTask('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update checklist'));
    }
  };

  const addSuggestion = async (suggestion) => {
    await addItem(suggestion.task);
    setSuggestions(prev => prev.filter(s => s.task !== suggestion.task));
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (newTask.trim()) addItem(newTask.trim());
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="page-header">Event Checklist</h1>
      <div className="card mb-6">
        <label className="label">Select Event</label>
        <select className="select-field" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>

      {event && (
        <>
          {/* Progress */}
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-dark-900">{event.name}</h2>
              <span className="text-primary-600 font-bold">{checklist.length > 0 ? Math.round((completed / checklist.length) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-dark-100 rounded-full h-3">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${checklist.length > 0 ? (completed / checklist.length) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-dark-400 mt-2">{completed}/{checklist.length} completed</p>
          </div>

          {/* Suggested Tasks */}
          {filteredSuggestions.length > 0 && (
            <div className="card mb-6 border-2 border-amber-200 bg-amber-50/30">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineLightBulb size={20} className="text-amber-600" />
                <h2 className="font-bold text-dark-900">Suggested Tasks</h2>
                <span className="text-xs text-dark-400">Based on your confirmed vendors</span>
              </div>
              <div className="space-y-2">
                {filteredSuggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-amber-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark-700">{s.task}</p>
                      <p className="text-xs text-dark-400 mt-0.5">{s.categoryName} • {s.vendorName}</p>
                    </div>
                    <button
                      onClick={() => addSuggestion(s)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      <HiOutlinePlus size={14} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingSuggestions && (
            <div className="card mb-6 text-center py-4">
              <p className="text-sm text-dark-400 animate-pulse">Loading suggestions from booked vendors...</p>
            </div>
          )}

          {/* Checklist */}
          <div className="card">
            <h2 className="font-bold text-dark-900 mb-4">Your Checklist</h2>
            {checklist.length === 0 ? (
              <p className="text-dark-400 text-sm mb-4">No tasks yet. Add tasks manually or use the suggestions above.</p>
            ) : (
              <div className="space-y-1 mb-4">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-50 group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleItem(i)}
                      className="w-5 h-5 rounded text-primary-600 cursor-pointer"
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through text-dark-400' : 'text-dark-700'}`}>
                      {item.task}
                    </span>
                    {item.completed && <HiOutlineCheckCircle className="text-emerald-500 flex-shrink-0" size={20} />}
                    <button
                      onClick={() => removeItem(i)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                      title="Remove task"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add Task */}
            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Add a new task..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                maxLength={120}
              />
              <button
                type="submit"
                disabled={!newTask.trim()}
                className="btn-primary disabled:opacity-50 whitespace-nowrap"
              >
                <HiOutlinePlus size={18} className="inline mr-1" />
                Add
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default EventChecklist;
