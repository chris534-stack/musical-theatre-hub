import React, { useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import useIsAdmin from './useIsAdmin';

interface EventDate {
  date: any; // date object from DatePicker
  mainTime?: string;
  isMatinee?: boolean;
  matineeTime?: string;
}
interface EventFormValues {
  category: '' | 'performance' | 'audition' | 'workshop';
  title: string;
  venue: string;
  description: string;
  director?: string;
  instructor?: string;
  requirements?: string;
  dates: EventDate[];
  ticketLink?: string;
}

const initialValuesDefault: EventFormValues = {
  category: '',
  title: '',
  venue: '',
  description: '',
  director: '',
  instructor: '',
  requirements: '',
  dates: [],
  ticketLink: '',
};

interface MultiStepAddEventFormProps {
  onSuccess: () => void;
  editMode?: boolean;
  initialValues?: EventFormValues;
}

const MultiStepAddEventForm = ({ onSuccess, editMode = false, initialValues }: MultiStepAddEventFormProps) => {
  // --- Date Picker open state for dismiss-on-blur UX ---
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Handle per-date matinee changes
  const handleDateMatineeChange = (idx: number, field: 'isMatinee' | 'matineeTime', value: any) => {
    setValues(v => {
      const newDates = [...v.dates];
      newDates[idx] = { ...newDates[idx], [field]: value };
      return { ...v, dates: newDates };
    });
  };

  const isAdmin = useIsAdmin();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<EventFormValues>(initialValues ? { ...initialValues } : { ...initialValuesDefault });
  const [defaultMainTime, setDefaultMainTime] = useState('19:30');
  const [defaultMatineeTime, setDefaultMatineeTime] = useState('14:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  const handleChange = (field: keyof EventFormValues, value: any) => {
    setValues(v => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Generate slug by title
    const slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let allOk = true;
    for (const d of values.dates) {
      let dateStr;
      if (d.date && typeof d.date.format === 'function') {
        dateStr = d.date.format('YYYY-MM-DD');
      } else if (typeof d.date === 'string') {
        dateStr = d.date;
      } else if (d.date instanceof Date) {
        dateStr = d.date.toISOString().slice(0, 10);
      } else {
        dateStr = '';
      }
      if (values.category === 'performance') {
        const endpoint = editMode ? '/api/update-event' : '/api/add-event';
        // Only create main event if mainTime is present
        if (d.mainTime) {
          const mainEvent = {
            title: values.title,
            slug,
            venue: values.venue,
            description: values.description,
            director: values.director,
            category: 'performance',
            date: dateStr,
            time: d.mainTime,
            ticketLink: values.ticketLink,
            isMatinee: false,
          };
          // Debug: log the main event
          // eslint-disable-next-line no-console
          console.log('Submitting main event:', mainEvent);
          const res1 = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mainEvent),
          });
          if (!res1.ok) allOk = false;
        }
        // Only create matinee event if isMatinee and matineeTime are present
        if (d.isMatinee && d.matineeTime) {
          const matineeEvent = {
            title: values.title,
            slug,
            venue: values.venue,
            description: values.description,
            director: values.director,
            category: 'performance',
            date: dateStr,
            time: d.matineeTime,
            ticketLink: values.ticketLink,
            isMatinee: true,
          };
          // Debug: log the matinee event
          // eslint-disable-next-line no-console
          console.log('Submitting matinee event:', matineeEvent);
          const res2 = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matineeEvent),
          });
          if (!res2.ok) allOk = false;
        } else if (editMode && d.matineeTime) {
          // Remove any existing matinee event for this date/time
          await fetch('/api/remove-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, date: dateStr, time: d.matineeTime }),
          });
        }
      } else if (values.category === 'workshop' || values.category === 'audition') {
        // Single event (workshop or audition)
        const event: any = {
          title: values.title,
          slug,
          venue: values.venue,
          description: values.description,
          category: values.category,
          date: dateStr,
          time: d.mainTime,
        };
        if (values.category === 'workshop') {
          event.instructor = values.instructor;
        }
        if (values.category === 'audition') {
          event.requirements = values.requirements;
        }
        const endpoint = editMode ? '/api/update-event' : '/api/add-event';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (!res.ok) allOk = false;
      }
    }
    setLoading(false);
    if (allOk) {
      if (initialValues) {
        setValues({ ...initialValues, dates: initialValues.dates ? initialValues.dates.map(d => ({ date: d.date, mainTime: '' })) : [] });
      } else {
        setValues({ ...initialValuesDefault });
      }
      setStep(1);
      onSuccess();
    } else {
      setError('Failed to add one or more events.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320 }}>
      {step === 1 && (
        <>
          <label style={{ fontWeight: 600 }}>Event Type</label>
          <select value={values.category} onChange={e => handleChange('category', e.target.value as EventFormValues['category'])} required>
            <option value='' disabled>Select type</option>
            <option value='performance'>Performance</option>
            <option value='audition'>Audition</option>
            <option value='workshop'>Workshop</option>
          </select>
          <button type='button' onClick={handleNext} disabled={!values.category}>Next</button>
        </>
      )}
      {step === 2 && (
        <>
          <button type='button' onClick={handleBack}>&larr; Back</button>
          <label style={{ fontWeight: 600 }}>Title</label>
          <input value={values.title} onChange={e => handleChange('title', e.target.value)} required />
          <label style={{ fontWeight: 600 }}>Venue</label>
<input value={values.venue} onChange={e => handleChange('venue', e.target.value)} required />

          {/* Per-date main and matinee times */}
          <div style={{ margin: '1rem 0' }}>
  <label style={{ fontWeight: 600 }}>Dates and Times</label>
  <div style={{ marginBottom: 10 }}>
    <label style={{ fontWeight: 600, marginRight: 8 }}>Default Regular Performance Time:</label>
    <input type="time" value={defaultMainTime} onChange={e => setDefaultMainTime(e.target.value)} style={{ marginRight: 24 }} />
    <label style={{ fontWeight: 600, marginRight: 8 }}>Default Matinee Time:</label>
    <input type="time" value={defaultMatineeTime} onChange={e => setDefaultMatineeTime(e.target.value)} />
  </div>
  {/* DatePicker with controlled open state and onClose for outside click */}
  {/*
    react-multi-date-picker (DatePicker) does not support open/onClose in all versions. If not supported, fallback to default behavior.
    TODO: If your version does not support 'open', consider updating or use a wrapper for dismiss-on-blur.
  */}
  <DatePicker
    multiple
    value={values.dates.map(d => d.date)}

    onChange={dates => {
      setDatePickerOpen(false); // close after change as well
      // Ensure dates is always an array of EventDate objects
      const newDates = Array.isArray(dates)
        ? dates.map(date => {
            // Try to preserve times for existing dates
            const dateStr = date && typeof date.format === 'function' ? date.format('YYYY-MM-DD') : (typeof date === 'string' ? date : '');
            const existing = values.dates.find(d => {
              if (typeof d.date === 'string') {
                return d.date === dateStr;
              }
              if (d.date && typeof d.date.format === 'function') {
                return d.date.format('YYYY-MM-DD') === dateStr;
              }
              return false;
            });
            // If new, default times
            return existing || { date, mainTime: defaultMainTime, isMatinee: false, matineeTime: defaultMatineeTime };
          })
        : [];
      handleChange('dates', newDates);
    }}
    format="YYYY-MM-DD"
    placeholder="Select dates"

    inputClass="date-picker-input"
  />
  {values.dates.length > 0 && values.dates.map((d, idx) => (
    <div key={idx} style={{ border: '1px solid #ccc', borderRadius: 4, padding: 8, marginBottom: 8 }}>
      <div>Date: {typeof d.date === 'string' ? d.date : d.date && typeof d.date.format === 'function' ? d.date.format('YYYY-MM-DD') : d.date?.toString?.() ?? ''}</div>
      <label>Main Time: </label>
      <input
        type="time"
        value={d.mainTime || ''}
        onChange={e => {
          const newDates = [...values.dates];
          newDates[idx] = { ...newDates[idx], mainTime: e.target.value };
          handleChange('dates', newDates);
        }}
        required
        placeholder={defaultMainTime}
      />
      <label style={{ marginLeft: 12 }}>Matinee</label>
      <input
        type="checkbox"
        checked={!!d.isMatinee}
        onChange={e => {
          const checked = e.target.checked;
          const newDates = [...values.dates];
          newDates[idx] = {
            ...newDates[idx],
            isMatinee: checked,
            matineeTime: checked
              ? (newDates[idx].matineeTime || defaultMatineeTime)
              : ''
          };
          handleChange('dates', newDates);
        }}
        style={{ marginLeft: 8, marginRight: 4 }}
      />
      <label style={{ marginLeft: 8 }}>Matinee Time:</label>
      <input
        type="time"
        value={d.matineeTime || ''}
        onChange={e => {
          const newDates = [...values.dates];
          newDates[idx] = { ...newDates[idx], matineeTime: e.target.value };
          handleChange('dates', newDates);
        }}
        disabled={!d.isMatinee}
        placeholder={defaultMatineeTime}
      />
    </div>
  ))}
</div>
          <input value={values.venue} onChange={e => handleChange('venue', e.target.value)} required />
          <label style={{ fontWeight: 600 }}>Description</label>
          <textarea value={values.description} onChange={e => handleChange('description', e.target.value)} required />
          {values.category === 'performance' && (
            <>
              <label style={{ fontWeight: 600 }}>Director</label>
              <input value={values.director} onChange={e => handleChange('director', e.target.value)} />
              <label style={{ fontWeight: 600 }}>Ticket Link (optional)</label>
              <input
                type="url"
                value={values.ticketLink}
                onChange={e => handleChange('ticketLink', e.target.value)}
                placeholder="https://buytickets.example.com"
              />
            </>
          )}
          {values.category === 'workshop' && (
            <>
              <label style={{ fontWeight: 600 }}>Instructor</label>
              <input value={values.instructor} onChange={e => handleChange('instructor', e.target.value)} />
            </>
          )}
          {values.category === 'audition' && (
            <>
              <label style={{ fontWeight: 600 }}>Requirements</label>
              <textarea value={values.requirements} onChange={e => handleChange('requirements', e.target.value)} />
            </>
          )}
          <button type='button' onClick={handleNext} disabled={!values.title || !values.venue || !values.description}>Next</button>
        </>
      )}
      {step === 3 && (
        <>
          <button type='button' onClick={handleBack}>&larr; Back</button>
          <label style={{ fontWeight: 600 }}>Event Dates</label>
          <DatePicker
            multiple
            value={values.dates.map(d => d.date)}
            onChange={dates => {
              // Convert selected dates into array of EventDate objects, preserving matinee info if possible
              setValues(v => {
                // If dates is array of date objects, keep isMatinee/matineeTime/mainTime if present
                const newDates = dates.map((d: any) => {
                  const existing = v.dates.find(ed => ed.date.format ? ed.date.format('YYYY-MM-DD') === d.format('YYYY-MM-DD') : ed.date.toISOString().slice(0, 10) === d.toISOString().slice(0, 10));
                  return existing ? existing : { date: d, mainTime: '' };
                });
                return { ...v, dates: newDates };
              });
            }}
            format='YYYY-MM-DD'
            placeholder='Select dates'
          />

          {values.category === 'performance' && values.dates.length > 0 && (
            <>
              <label style={{ fontWeight: 600 }}>Matinee Performances</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {values.dates.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{d.date && typeof d.date.format === 'function'
  ? d.date.format('YYYY-MM-DD')
  : typeof d.date === 'string'
    ? d.date
    : d.date instanceof Date
      ? d.date.toISOString().slice(0, 10)
      : ''}</span>
                    <label style={{ fontWeight: 400 }}>
                      <input
                        type='checkbox'
                        checked={d.isMatinee}
                        onChange={e => {
                          const checked = e.target.checked;
                          const newDates = [...values.dates];
                          newDates[idx] = {
                            ...newDates[idx],
                            isMatinee: checked,
                            matineeTime: checked ? newDates[idx].matineeTime : ''
                          };
                          handleChange('dates', newDates);
                        }}
                        style={{ marginLeft: 8, marginRight: 4 }}
                      />
                      Matinee
                    </label>
                    {d.isMatinee && (
                      <>
                        <label style={{ fontWeight: 400, marginLeft: 8 }}>Time:</label>
                        <input
                          type='time'
                          value={d.matineeTime || ''}
                          onChange={e => handleDateMatineeChange(idx, 'matineeTime', e.target.value)}
                          style={{ marginLeft: 4 }}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <button type='submit' disabled={loading || values.dates.length === 0 || values.dates.some(d => !d.mainTime && !d.matineeTime)}>{loading ? 'Adding...' : 'Submit'}</button>
{values.dates.some(d => !d.mainTime && !d.matineeTime) && (
  <div style={{ color: 'red', marginTop: 8, fontSize: 13 }}>
    Each date must have at least a Main Time or a Matinee Time.
  </div>
) }
        </>
      )}
      {/* Debug: Show current dates state */}
      <pre style={{ background: '#f4f4f4', fontSize: 12, padding: 8, margin: '1em 0', maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(values.dates, null, 2)}</pre>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
};

export default MultiStepAddEventForm;
