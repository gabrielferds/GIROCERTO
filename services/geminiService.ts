
import { GoogleGenAI, Type } from "@google/genai";
import { DailyEntry } from "../types";

export const getFinancialInsights = async (entries: DailyEntry[]) => {
  // Ensure the AI client is initialized with the correct configuration
  const ai = null;
  
  const summary = entries.map(e => ({
    date: e.date,
    profit: e.earnings.reduce((acc, cur) => acc + cur.amount, 0) - e.expenses.reduce((acc, cur) => acc + cur.amount, 0),
    hours: e.hoursWorked,
    status: e.status
  }));

  const prompt = `
    Você é um assistente financeiro humanizado e motivacional para motoboys e entregadores.
    Analise os seguintes dados de trabalho e finanças (formato JSON): ${JSON.stringify(summary)}
    
    Responda em JSON com os seguintes campos:
    - message: Uma mensagem motivacional curta e realista (máximo 150 caracteres).
    - tip: Uma dica prática baseada nos dados (ex: "Sexta parece ser seu melhor dia, tente focar nele").
    - projection: Uma estimativa de ganho mensal baseado na média atual.
    
    Linguagem deve ser simples, "papo de brother", focada em quem está no corre diário.
  `;

  try {
    throw new Error("A análise por IA ainda precisa de configuração no servidor.");
  } catch (error) {
    console.error("Error fetching insights:", error);
    return {
      message: "Bora pra cima! Cada entrega te deixa mais perto do seu objetivo.",
      tip: "Mantenha a moto em dia para não ter surpresas no meio do corre.",
      projection: "Análise por IA ainda não disponível."
    };
  }
};
