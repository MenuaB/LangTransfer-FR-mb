export const SCENARIOS = [
  {
    id: 'find-keys',
    title: 'Find the keys',
    requiredTrack: 22,
    turns: [
      { en: "I'm trying to find the keys.", fr: "J'essaye de trouver les clés.", note: 'Use essayer de before the infinitive.' },
      { en: 'Where is the car key?', fr: 'Où est la clé de la voiture ?', note: 'Use où for where.' },
      { en: "I'm from here.", fr: "Je suis d'ici.", note: "D'ici means from here." }
    ]
  },
  {
    id: 'reserve-later',
    title: 'Reserve it later',
    requiredTrack: 8,
    turns: [
      { en: 'I want to reserve it.', fr: 'Je veux la réserver.', note: 'Object pronoun before the second verb.' },
      { en: 'I must confirm it later.', fr: 'Je dois la confirmer plus tard.', note: 'Devoir works like vouloir before an infinitive.' },
      { en: 'Can you organise it?', fr: "Peux-tu l'organiser ?", note: "Use l' before a vowel." }
    ]
  },
  {
    id: 'what-to-do',
    title: 'What should we do?',
    requiredTrack: 31,
    turns: [
      { en: 'What do you want to do?', fr: 'Qu\'est-ce que tu veux faire ?', note: "Qu'est-ce que is a frozen what-question." },
      { en: "I can't do it.", fr: 'Je ne peux pas le faire.', note: 'Ne...pas surrounds the first verb.' },
      { en: "She buys something.", fr: 'Elle achète quelque chose.', note: 'Watch the accent change in achète.' }
    ]
  }
];

export function availableScenarios(unlockedTrack, scenarios = SCENARIOS) {
  return scenarios.filter(scenario => scenario.requiredTrack <= unlockedTrack);
}
