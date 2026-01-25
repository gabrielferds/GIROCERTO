
import { DailyEntry } from '../types';
import { format } from 'date-fns';

const NOTIFICATION_MESSAGES = {
  motivacional: [
    "Mais um dia de corre merece um controle de mestre! 💪",
    "O suor de hoje é o lucro de amanhã. Bora registrar? 💸",
    "Seu esforço vale muito. Vamos ver quanto rendeu hoje? 🚀"
  ],
  apoio: [
    "Organizar hoje deixa o amanhã muito mais leve, parceiro. 🤜🤛",
    "Dois minutinhos agora pra não ter dor de cabeça depois. 🎯",
    "Registrar hoje é cuidar do seu futuro sobre duas rodas. 🏍️"
  ],
  progresso: [
    "Cada lançamento te deixa um passo mais perto da sua meta! 🏁",
    "Bora ver como está o seu giro? O controle é sua melhor ferramenta. 🛠️",
    "Acompanhar seu progresso é o segredo do sucesso no corre. 📈"
  ],
  empatia: [
    "Corre puxado hoje? Quando der um descanso, registra os ganhos aqui. ☕",
    "Sabemos que a rua é brava. Deixa a gente cuidar dos números pra você. 🛡️",
    "Nada como fechar o dia com tudo organizado. Bora? ✅"
  ]
};

export const getRandomMessage = () => {
  const categories = Object.keys(NOTIFICATION_MESSAGES) as Array<keyof typeof NOTIFICATION_MESSAGES>;
  const category = categories[Math.floor(Math.random() * categories.length)];
  const categoryMessages = NOTIFICATION_MESSAGES[category];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
};

export const shouldNotify = (entries: DailyEntry[]): boolean => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const alreadyLaunched = entries.some(e => e.date === today);
  
  if (alreadyLaunched) return false;

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Janelas de notificação: 18:30 às 18:45 ou 23:30 às 23:45
  const isFirstWindow = (hours === 18 && minutes >= 30);
  const isSecondWindow = (hours === 23 && minutes >= 30);

  // Verifica se já notificou hoje para evitar spam
  const lastNotification = localStorage.getItem('girocerto_last_notification');
  const alreadyNotifiedToday = lastNotification === today;

  return (isFirstWindow || isSecondWindow) && !alreadyNotifiedToday;
};

export const markAsNotified = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  localStorage.setItem('girocerto_last_notification', today);
};
