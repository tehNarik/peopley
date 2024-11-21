import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // для можливості взаємодії

const TeacherSchedule = () => {
  const [events, setEvents] = useState([]);

  // Функція, що додає новий урок при кліку на час у календарі
  const handleDateClick = async (info) => {
    const newEvent = {
      title: 'Новий урок',
      start: info.dateStr,
      end: new Date(info.dateStr).setHours(new Date(info.dateStr).getHours() + 1), // Тривалість 1 година
    };

    // Збереження уроку через API
    const response = await fetch('/api/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEvent),
    });

    if (response.ok) {
      const savedEvent = await response.json();
      setEvents([...events, savedEvent.lesson]); // Оновлення подій календаря новим уроком
    } else {
      console.error('Помилка при збереженні уроку');
    }
  };

  return (
    <div>
      <h2>Розклад вчителя</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} // Підключення плагінів
        initialView="timeGridWeek" // Відображення календаря по годинам тижня
        events={events} // Події, які відображаються у календарі
        dateClick={handleDateClick} // Виклик функції при кліку на час у календарі
      />
    </div>
  );
};

export default TeacherSchedule;
