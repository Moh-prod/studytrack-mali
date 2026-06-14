import { GoogleGenerativeAI } from "@google/generative-ai";
import dayjs from 'dayjs';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash',
  systemInstruction: `Tu es le Coach IA de StudyTrack Mali, une application de productivité pour étudiants.

RÈGLES :
- Réponds TOUJOURS en français.
- Sois bienveillant, motivant et concis (max 150 mots par réponse).
- Utilise des emojis avec parcimonie (1-2 par message maximum).
- Donne des conseils pratiques, actionnables et personnalisés basés sur les données de l'utilisateur.
- Si l'utilisateur semble fatigué ou démotivé, encourage-le sans être condescendant.
- Tu es un coach d'études, pas un chatbot généraliste. Reste dans le domaine de la productivité, des études et du bien-être étudiant.
- Ne révèle jamais que tu es un modèle Gemini ou une IA de Google. Tu es simplement "le Coach StudyTrack".`,
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
  },
});

/**
 * aiService.js — Service IA central pour StudyTrack Mali
 *
 * Fournit des fonctions pour interagir avec Gemini 1.5 Flash :
 * - Génération d'insights quotidiens/hebdomadaires
 * - Chat interactif avec le coach IA
 * - Gestion du cache et des erreurs
 */

// ─── Cache local pour éviter les appels répétés ──────────────────────
const CACHE_KEY_PREFIX = 'studytrack_ai_insights_';

function getCachedInsights(key) {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
    }
  } catch (e) { /* ignore */ }
  return null;
}

function setCachedInsights(key, data, ttlMs = 12 * 60 * 60 * 1000) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({
      data,
      expiry: Date.now() + ttlMs,
    }));
  } catch (e) { /* ignore */ }
}

// ─── Formater les données contextuelles ──────────────────────────────
function formatUserContext({ tasks, habits, streak }) {
  const today = dayjs().format('YYYY-MM-DD');
  const todayTasks = (tasks || []).filter((t) => t.date === today);
  const doneTasks = todayTasks.filter((t) => t.done);
  const overdueTasks = (tasks || []).filter((t) => t.date < today && !t.done);

  const habitsDoneToday = (habits || []).filter((h) =>
    (h.completedDates || []).includes(today)
  );

  return `CONTEXTE DE L'UTILISATEUR (${today}) :
- Tâches du jour : ${todayTasks.length} prévues, ${doneTasks.length} terminées
- Tâches en retard : ${overdueTasks.length}
- Habitudes du jour : ${habitsDoneToday.length}/${(habits || []).length} complétées
- Série active (streak) : ${streak || 0} jours consécutifs
- Tâches prioritaires non faites : ${todayTasks.filter((t) => !t.done && (t.priority === 'urgent' || t.priority === 'high')).map((t) => t.text).join(', ') || 'Aucune'}`;
}

// ─── Générer les insights du Dashboard ───────────────────────────────
/**
 * Génère 3 conseils personnalisés pour le Dashboard.
 * Les résultats sont mis en cache 12h pour éviter les appels redondants.
 */
export async function generateDashboardInsights({ tasks, habits, streak }) {
  const cacheKey = `dashboard_${dayjs().format('YYYY-MM-DD')}`;
  const cached = getCachedInsights(cacheKey);
  if (cached) return cached;

  const context = formatUserContext({ tasks, habits, streak });

  const prompt = `${context}

En te basant sur ces données, génère exactement 3 conseils courts et personnalisés pour améliorer la productivité de cet étudiant aujourd'hui.

Réponds en JSON UNIQUEMENT avec ce format (pas de markdown, pas de texte avant/après) :
[
  { "icon": "emoji", "text": "conseil court en 1-2 phrases" },
  { "icon": "emoji", "text": "conseil court en 1-2 phrases" },
  { "icon": "emoji", "text": "conseil court en 1-2 phrases" }
]`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    // Extract JSON from potential markdown code block
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      setCachedInsights(cacheKey, insights);
      return insights;
    }
    throw new Error('Invalid JSON response');
  } catch (error) {
    console.warn('[AIService] Dashboard insights error:', error);
    return null;
  }
}

// ─── Générer les insights d'un rapport quotidien ─────────────────────
/**
 * Analyse un rapport quotidien et génère des insights personnalisés.
 */
export async function generateReportInsights(reportData) {
  const prompt = `Voici le résumé de la journée d'un étudiant :
- Score de productivité : ${reportData.productivityScore || 0}/100
- Tâches : ${reportData.tasksDone || 0}/${reportData.tasksTotal || 0} terminées
- Habitudes : ${reportData.habitsDone || 0}/${reportData.habitsTotal || 0} respectées
- Sessions Pomodoro : ${reportData.pomodoroSessions || 0}
- Humeur : ${reportData.mood || 'non renseignée'}

Fais une analyse courte et bienveillante de cette journée en 3-4 phrases maximum. Identifie un point fort, un axe d'amélioration, et termine par un encouragement. Réponds en texte brut (pas de JSON, pas de markdown).`;

  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.warn('[AIService] Report insights error:', error);
    return null;
  }
}

// ─── Chat avec le Coach IA ───────────────────────────────────────────
/**
 * Envoie un message au coach IA avec l'historique de la conversation.
 * @param {Array} history - Historique [{role: 'user'|'model', parts: [{text}]}]
 * @param {string} message - Nouveau message de l'utilisateur
 * @param {Object} context - {tasks, habits, streak}
 * @returns {Promise<string>} Réponse du coach
 */
export async function chatWithCoach(history, message, context) {
  const contextStr = formatUserContext(context);

  // Build the full conversation with context injected in first user message
  const fullHistory = history.length === 0
    ? [] // First message, context will be prepended
    : history.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      }));

  const userMessage = history.length === 0
    ? `${contextStr}\n\nMessage de l'étudiant : ${message}`
    : message;

  try {
    const chat = geminiModel.startChat({
      history: fullHistory,
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text().trim();
  } catch (error) {
    console.warn('[AIService] Chat error:', error);
    const errMsg = error.message || '';
    if (errMsg.includes('API key') || errMsg.includes('API_KEY') || errMsg.includes('key not valid') || errMsg.includes('invalid')) {
      return "Ta clé API Gemini semble incorrecte ou invalide. Assure-toi de l'avoir correctement générée sur Google AI Studio (https://aistudio.google.com/) et configurée dans firebase.js ! 🔑";
    }
    if (errMsg.includes('quota') || errMsg.includes('429')) {
      return "J'ai atteint ma limite de requêtes pour le moment. Réessaie dans quelques minutes ! 😊";
    }
    if (errMsg.includes('network') || errMsg.includes('fetch')) {
      return "Il semble que tu n'aies pas de connexion internet. Reconnecte-toi et réessaie !";
    }
    return "Désolé, une erreur est survenue. Réessaie dans quelques instants.";
  }
}
