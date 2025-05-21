import React, { useState } from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import useIsAdmin from './useIsAdmin';
import { supabase } from '../lib/supabaseClient';

// Helper function to normalize dates to YYYY-MM-DD format
const formatDateString = (date: Date | DateObject): string => {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  } else if (date && typeof date === 'object' && 'year' in date) {
    const dateObj = date as DateObject;
    return new Date(Number(dateObj.year), Number(dateObj.month) - 1, Number(dateObj.day)).toISOString().split('T')[0];
  }
  return '';
};

// Helper to convert DateObject to Date
const dateObjectToDate = (date: Date | DateObject): Date => {
  if (date instanceof Date) return date;
  return new Date(Number(date.year), Number(date.month) - 1, Number(date.day));
};

interface EventDate {
  date: Date;
  mainTime: string;
  isMatinee: boolean;
  matineeTime: string;
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
  const handleDateMatineeChange = (idx: number, field: 'isMatinee' | 'matineeTime', value: boolean | string) => {
    setValues(v => {
      const newDates = [...v.dates];
      if (newDates[idx]) {
        newDates[idx] = { ...newDates[idx], [field]: value };
      }
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
    
    try {
      // Generate slug by title
      const slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Process each date
      const processedDates = values.dates.map(d => {
        const dateStr = formatDateString(d.date);
        return {
          date: dateStr,
          mainTime: d.mainTime || null,
          isMatinee: d.isMatinee || false,
          matineeTime: d.matineeTime || null
        };
      });

      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Prepare the event data
      const eventData = {
        title: values.title,
        description: values.description,
        venue_id: values.venue, // Assuming venue is the ID
        dates: processedDates,
        director: values.director,
        ticketLink: values.ticketLink,
        category: values.category,
        requirements: values.requirements,
        instructor: values.instructor
      };

      // Submit to the API
      const response = await fetch('/api/add-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add event');
      }

      // If we get here, the event was added successfully
      setValues(initialValues || { ...initialValuesDefault });
      setStep(1);
      onSuccess();
    } catch (err) {
      console.error('Error submitting event:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
      {step === 1 && (
        <React.Fragment>
          <label style={{ fontWeight: 600 }}>Event Type</label>
          <select value={values.category} onChange={e => handleChange('category', e.target.value as EventFormValues['category'])} required>
            <option value='' disabled>Select type</option>
            <option value='performance'>Performance</option>
            <option value='audition'>Audition</option>
            <option value='workshop'>Workshop</option>
          </select>
          <button type='button' onClick={handleNext} disabled={!values.category}>Next</button>
        </React.Fragment>
      )}
      {step === 2 && (
        <React.Fragment>
          <button type='button' onClick={handleBack}>&larr; Back</button>
          <label style={{ fontWeight: 600 }}>Title</label>
          <input value={values.title} onChange={e => handleChange('title', e.target.value)} required />
          <label style={{ fontWeight: 600 }}>Venue</label>
          <input value={values.venue} onChange={e => handleChange('venue', e.target.value)} required />
          <label style={{ fontWeight: 600 }}>Description</label>
          <textarea value={values.description} onChange={e => handleChange('description', e.target.value)} required />
          {values.category === 'performance' && (
            <React.Fragment>
              <label style={{ fontWeight: 600 }}>Director</label>
              <input value={values.director} onChange={e => handleChange('director', e.target.value)} />
              <label style={{ fontWeight: 600 }}>Ticket Link (optional)</label>
              <input
                type="url"
                value={values.ticketLink}
                onChange={e => handleChange('ticketLink', e.target.value)}
                placeholder="https://buytickets.example.com"
              />
            </React.Fragment>
          )}
          {values.category === 'workshop' && (
            <React.Fragment>
              <label style={{ fontWeight: 600 }}>Instructor</label>
              <input value={values.instructor} onChange={e => handleChange('instructor', e.target.value)} />
            </React.Fragment>
          )}
          {values.category === 'audition' && (
            <React.Fragment>
              <label style={{ fontWeight: 600 }}>Requirements</label>
              <textarea value={values.requirements} onChange={e => handleChange('requirements', e.target.value)} />
            </React.Fragment>
          )}
          <button type='button' onClick={handleNext} disabled={!values.title || !values.venue || !values.description}>Next</button>
        </React.Fragment>
      )}
      {step === 3 && (
        <React.Fragment>
          <button type='button' onClick={handleBack}>&larr; Back</button>
          <label style={{ fontWeight: 600 }}>Event Dates</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <DatePicker
              multiple
              value={values.dates.map(d => d.date)}
              onChange={dates => {
                if (!dates) return;
                
                setValues(v => {
                  const dateArray = Array.isArray(dates) ? dates : [dates];
                  const newDates: EventDate[] = dateArray.map(date => {
                    const dateObj = dateObjectToDate(date);
                    const dateStr = formatDateString(dateObj);
                    const existing = v.dates.find(d => formatDateString(d.date) === dateStr);
                    return existing || { 
                      date: dateObj,
                      mainTime: defaultMainTime,
                      isMatinee: false,
                      matineeTime: defaultMatineeTime 
                    };
                  });
                  return { ...v, dates: newDates };
                });
              }}
              format='YYYY-MM-DD'
              placeholder='Select dates'
              onOpen={() => setDatePickerOpen(true)}
              onClose={() => setDatePickerOpen(false)}
              containerStyle={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
              renderButton={() => null}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => (document.querySelector('.rmdp-input') as HTMLElement)?.click()}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  flex: '1',
                  textAlign: 'left',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                {values.dates.length > 0 
                  ? `${values.dates.length} date${values.dates.length !== 1 ? 's' : ''} selected` 
                  : 'Select dates'}
              </button>
              {datePickerOpen && (
                <button 
                  type="button" 
                  onClick={() => {
                    const picker = document.querySelector('.rmdp-container');
                    if (picker) {
                      picker.remove();
                      setDatePickerOpen(false);
                    }
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                >
                  Done
                </button>
              )}
              {!datePickerOpen && values.dates.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => (document.querySelector('.rmdp-input') as HTMLElement)?.click()}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {values.category === 'performance' && values.dates.length > 0 && (
            <React.Fragment>
              <label style={{ fontWeight: 600 }}>Matinee Performances</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {values.dates.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{formatDateString(d.date)}</span>
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
                      <React.Fragment>
                        <label style={{ fontWeight: 400, marginLeft: 8 }}>Time:</label>
                        <input
                          type='time'
                          value={d.matineeTime || ''}
                          onChange={e => handleDateMatineeChange(idx, 'matineeTime', e.target.value)}
                          style={{ marginLeft: 4 }}
                        />
                      </React.Fragment>
                    )}
                  </div>
                ))}
              </div>
            </React.Fragment>
          )}
          <button type='submit' disabled={loading || values.dates.length === 0 || values.dates.some(d => !d.mainTime && !d.matineeTime)}>{loading ? 'Adding...' : 'Submit'}</button>
{values.dates.some(d => !d.mainTime && !d.matineeTime) && (
  <div style={{ color: 'red', marginTop: 8, fontSize: 13 }}>
    Each date must have at least a Main Time or a Matinee Time.
  </div>
) }
        </React.Fragment>
      )}
      {/* Debug: Show current dates state */}
      <pre style={{ background: '#f4f4f4', fontSize: 12, padding: 8, margin: '1em 0', maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(values.dates, null, 2)}</pre>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
};

export default MultiStepAddEventForm;
