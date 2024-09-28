"use client";

import PrivateRoute from '@/components/PrivateRoute';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { addTaskToFirestore, getTasksFromFirestore, AnalyticsInit } from '../../public/utils/firebase';
import { addTask, getTasks } from '../../public/utils/indexedDb';

function isValidDate(date) {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate);
}

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [completed, setCompleted] = useState(false);

  const loadTasks = async () => {
    try {
      const tasksFromDB = await getTasks();

      if (navigator.onLine) {
        const tasksFromFirestore = await getTasksFromFirestore();

        const tasksMap = new Map();
        tasksFromDB.forEach(task => tasksMap.set(task.id, task));
        tasksFromFirestore.forEach(task => tasksMap.set(task.id, task));

        const mergedTasks = Array.from(tasksMap.values());

        await Promise.all(
          mergedTasks.map(async (task) => {
            try {
              await addTask(task);
            } catch (error) {
              console.error('Erro ao adicionar tarefa durante a sincronização:', error);
            }
          })
        );

        setTasks(mergedTasks);
      } else {
        setTasks(tasksFromDB);
      }
    } catch (error) {
      console.error('Erro ao carregar e mesclar tarefas:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    

    const loadAnalytics = async () => {
      await AnalyticsInit();
    }

    if(typeof window !== 'undefined'){
      loadAnalytics();
    }
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();

    const newTask = { id: Date.now(), title, time, date, completed };

    try {
      await addTaskToFirestore(newTask);
      await addTask(newTask);
      loadTasks();
    } catch (error) {
      console.error('Erro ao adicionar nova tarefa:', error);
    }

    setTitle('');
    setTime('');
    setDate('');
    setCompleted(false);
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  const groupByDate = (tasks) => {
    const grouped = tasks.reduce((groups, task) => {
      const date = task.date >= today ? task.date : 'passadas';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
      return groups;
    }, {});

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => (a.time > b.time ? 1 : -1));
    });

    return grouped;
  };

  const groupedTasks = groupByDate(tasks);

  return (
    <PrivateRoute>
      <div className="container mx-auto min-h-screen p-6 bg-gray-100">
        <h1 className="text-3xl mb-6 font-bold text-[#1E2047] text-center">Minhas Tarefas</h1>

        <form onSubmit={handleAddTask} className="mb-6 bg-white p-4 shadow-md rounded-lg space-y-4">
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
            <input
              type="text"
              placeholder="Título"
              className="border p-2 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2047]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="time"
              className="border p-2 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2047]"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
            <input
              type="date"
              className="border p-2 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2047]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />{' '}
              Completo
            </label>
            <button className="bg-[#1E2047] text-white p-2 rounded-lg hover:bg-[#393B65] transition" type="submit">
              Adicionar Tarefa
            </button>
          </div>
        </form>

        <h2 className="text-2xl mb-4 text-gray-700">Tarefas</h2>
        {Object.keys(groupedTasks).filter(date => date !== 'passadas').map((date) => (
          <div key={date} className="mb-6">
            <h3 className="text-xl font-bold text-[#1E2047] mb-2">
              {date === today ? 'Hoje' : format(new Date(date), 'dd/MM/yyyy')}
            </h3>
            <ul className="space-y-2">
              {groupedTasks[date].map((task) => (
                <li key={task.id} className="border p-4 rounded-lg bg-white shadow-sm flex justify-between items-center">
                  <span className="flex-1">
                    {task.title} às {task.time} -{' '}
                    {task.completed ? (
                      <span className="text-[#1E2047]">Concluída</span>
                    ) : (
                      <span className="text-red-500">Não Concluída</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <h2 className="text-2xl mb-4 text-gray-700">Tarefas Passadas</h2>
        <ul className="space-y-2">
          {groupedTasks['passadas']?.map((task) => (
            <li
              key={task.id}
              className="border p-4 rounded-lg bg-gray-200 flex justify-between items-center text-gray-500"
            >
              <span className="flex-1">
                {task.title} às {task.time} em{' '}
                {isValidDate(task.date) ? format(new Date(task.date), 'dd/MM/yyyy') : 'Data inválida'} -{' '}
                {task.completed ? (
                  <span className="text-[#1E2047]">Concluída</span>
                ) : (
                  <span className="text-red-500">Não Concluída</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PrivateRoute>
  );
}
