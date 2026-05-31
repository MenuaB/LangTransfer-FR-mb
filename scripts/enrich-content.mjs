import { readFile, writeFile } from 'node:fs/promises';

const tracksPath = 'public/data/tracks.json';
const exercisesPath = 'public/data/exercises.json';
const tracks = JSON.parse(await readFile(tracksPath, 'utf8'));
const exercises = JSON.parse(await readFile(exercisesPath, 'utf8'));

const trackMeta = {
  1: {
    concepts: ['gendered-articles', 'ion-feminine-pattern', 'object-pronoun-before-verb', 'vouloir'],
    build: ['Pick the noun gender first: le for masculine, la for feminine.', "Before a vowel, compress le/la to l'.", 'If the English says it, move le/la before veux.'],
    writing: ['Apostrophes matter in l’opinion and l’organisation.', 'Final x in veux is written but silent.', 'Accent marks in café and gâteau must be typed.'],
    traps: ['Do not put it after the verb as in English.', 'Do not guess gender for -ion words in this track; treat them as feminine.']
  },
  2: {
    concepts: ['english-ation-to-french-ation', 'ation-to-er-verb', 'un-peu', 'object-pronoun-before-infinitive'],
    build: ['Find the English -ation idea, then form the French -ation noun or -er verb.', 'After veux, keep the next verb in the infinitive.', 'If a pronoun belongs to the infinitive, place it before that infinitive.'],
    writing: ['Many -ation nouns look English-like but keep French accents elsewhere.', 'French infinitives here end in -er.', 'Write un peu as two words.'],
    traps: ['Do not translate to as a separate word before -er infinitives.', 'Do not move object pronouns after the infinitive.']
  },
  3: {
    concepts: ['modal-plus-infinitive', 'pouvoir', 'quelque-chose', 'com-con-prefix'],
    build: ['Choose veux or peux as the first verb.', 'Leave the action verb in the infinitive.', 'Use quelque chose when the English says something.'],
    writing: ['Peux keeps final x silent but written.', 'Quelque chose is two words.', 'Watch double m in recommander and commander.'],
    traps: ['Do not conjugate the second verb after peux.', 'Do not split quelque chose with an article.']
  },
  4: {
    concepts: ['inversion-questions', 'peux-tu', 'veux-tu', 'puis-je', 'fermer'],
    build: ['For formal questions, invert verb and subject.', 'Link the inverted verb and pronoun with a hyphen.', 'Keep the action verb in the infinitive after peux or veux.'],
    writing: ['Hyphens are part of inversion: peux-tu, veux-tu.', 'Puis-je is the special inversion of je peux.', 'Final r in fermer is written in the infinitive.'],
    traps: ['Do not write peux tu without a hyphen in inversion practice.', 'Do not use peux-je; the preserved form is puis-je.']
  },
  5: {
    concepts: ['de-possession', 'plus-tard', 'fermer-a-cle', 'un-peu-de', 'plic-family'],
    build: ['Use de to connect possession or amount.', 'Use plus tard for later.', 'For a little of something, build un peu de + noun.'],
    writing: ['À clé needs the accent on à and é in clé.', 'Plus tard is two words.', 'Explain-family verbs often keep -quer spelling.'],
    traps: ['Do not use English apostrophe-S possession.', 'Do not drop de after un peu when a noun follows.']
  },
  6: {
    concepts: ['devoir-obligation-debt', 'oi-sound', 'car-vocabulary', 'preparer-reparer'],
    build: ['Use dois for must or owe.', 'Put the action after dois in the infinitive.', 'Use de for car-key style possession.'],
    writing: ['Oi in dois, voiture, moi, toi sounds like /wa/.', 'Final s in dois is written but silent.', 'Réparer and préparer differ by prefix.'],
    traps: ['Do not add a separate to before French infinitives.', 'Do not pronounce written final consonants just because you type them.']
  },
  7: {
    concepts: ['maintenant', 'transport', 'a-temps', 'nasal-vowels', 'accent-grave'],
    build: ['Use maintenant for now and à temps for on time.', 'Choose le train or le bus as transport nouns.', 'Keep modal + infinitive structure when combining with earlier tracks.'],
    writing: ['À temps needs accent on à.', 'Maintenant has a nasal vowel and silent final t.', 'Accent grave marks open è in words like près later.'],
    traps: ['Do not translate on time literally word by word.', 'Do not forget articles before train and bus.']
  },
  8: {
    concepts: ['object-pronouns-two-verbs', 'le-la-l-before-infinitive', 'ette-feminine'],
    build: ['Identify the thing: masculine le, feminine la, plural les.', 'With two verbs, place the pronoun before the action infinitive.', "Before a vowel, use l'."],
    writing: ["Apostrophe in l’organiser is required.", 'Infinitive -er often sounds like é but is written -er.', 'Many -ette nouns are feminine.'],
    traps: ['Do not place the pronoun before veux when it belongs to the second verb.', 'Do not write le organiser before a vowel.']
  },
  9: {
    concepts: ['voir-ir-verb', 'me-te-pronouns', 'vocal-root', 'party-vocabulary'],
    build: ['Use voir for to see.', 'Use me or te before the verb they belong to.', 'Contract me/te before a vowel: m’ or t’.'],
    writing: ['Voir has oi spelling but /wa/ sound.', 'Apostrophes in m’inviter and t’inviter are not optional.', 'Fête has a circumflex.'],
    traps: ['Do not confuse tu as subject with te as object.', 'Do not leave me/te after the verb.']
  },
  10: {
    concepts: ['un-une', 'adjective-after-noun', 'noir-noire', 'liaison-un'],
    build: ['Choose un or une from the noun gender.', 'Put ordinary color adjectives after the noun.', 'Make adjectives agree when the noun is feminine.'],
    writing: ['Une has final e; un does not.', 'Noire writes final e and pronounces the r.', 'Un ami can link in speech but stays two words.'],
    traps: ['Do not put noir before café in these exercises.', 'Do not choose un/une based on the owner or speaker.']
  },
  11: {
    concepts: ['il-elle-third-person', 'silent-third-person-t', 'ary-to-aire', 'anniversaire'],
    build: ['Switch je/tu forms to il or elle forms.', 'Use doit, veut, peut for he/she.', 'Let -ary English adjectives suggest French -aire.'],
    writing: ['Third-person t in doit/veut/peut is written but usually silent.', 'Anniversaire has double n and double s.', 'Volontaire ends in -aire.'],
    traps: ['Do not add an extra ending after il/elle forms.', 'Do not treat c’est and il est as interchangeable later.']
  },
  12: {
    concepts: ['reflexive-verbs', 'se-preparer', 'me-te-se', 'portable'],
    build: ['For actions done to oneself, add the reflexive pronoun.', 'Match the reflexive pronoun to the subject.', 'With a modal, place se before the infinitive.'],
    writing: ['Se préparer has accent on é.', 'Je me, tu te, il se stay separate before consonants.', 'Portable is masculine in this course.'],
    traps: ['Do not translate get ready without the self-pronoun.', 'Do not confuse te object with tu subject.']
  },
  13: {
    concepts: ['able-suffix', 'porter-family', 'supporter-false-friend', 'wallet-compound'],
    build: ['Use -able to mean capable of being done.', 'Use porter as carry/wear, then add prefixes for bring/take.', 'Keep support/tolerate meaning clear for supporter.'],
    writing: ['-able looks familiar but still follows French spelling.', 'Portefeuille is one compound word.', 'Double consonants can appear in supporter.'],
    traps: ['Do not assume supporter means to support/help.', 'Do not memorize every prefixed porter verb separately; build from the direction.']
  },
  14: {
    concepts: ['ite-suffix', 'false-friends', 'adjective-noun-links', 'opportunity'],
    build: ['Map English -ity to French -ité where useful.', 'Pause on false friends and check the actual meaning.', 'Use earlier article and adjective agreement rules.'],
    writing: ['-ité usually carries acute é.', 'Opportunité is feminine.', 'French accents distinguish words that look English-like.'],
    traps: ['Do not trust every English-looking word.', 'Do not drop gender just because the noun is abstract.']
  },
  15: {
    concepts: ['tout-le-monde-singular', 'possessives-mon-ton', 'vowel-possessive', 'bien'],
    build: ['Treat tout le monde like he/she for the verb.', 'Choose mon/ma/ton/ta from the possessed noun.', 'Before a vowel, use mon or ton even for feminine nouns.'],
    writing: ['Tout le monde is three words.', 'Mon ami links in speech but remains two words.', 'Bien is written with -ien.'],
    traps: ['Do not use plural verb after everybody.', 'Do not choose ma amie before a vowel.']
  },
  16: {
    concepts: ['plural-les', 'attendre', 'direct-object-les', 'plural-silent-s'],
    build: ['Use les for plural the or them.', 'Use attendre for to wait for.', 'Place object les before the verb it belongs to.'],
    writing: ['Plural s is often written but silent.', 'Les can mean the or them depending on position.', 'Attendre has double t.'],
    traps: ['Do not add pour after attendre for wait for.', 'Do not confuse les article with les object; position tells you.']
  },
  17: {
    concepts: ['er-present', 'new-er-verbs', 'plural-nouns', 'sentence-combination'],
    build: ['For je/il ER present, remove -er and use the stem sound.', 'Use known nouns and verbs to make new combinations.', 'Keep articles and pronouns doing the structure work.'],
    writing: ['ER infinitive and é past forms will matter later.', 'Je forms can hide final written letters.', 'Plural nouns still need plural articles.'],
    traps: ['Do not over-conjugate every verb form yet.', 'Do not drop articles in short noun phrases.']
  },
  18: {
    concepts: ['a-le-au', 'de-le-du', 'aller', 'place-direction'],
    build: ['Contract à + le to au and de + le to du.', 'Use aller for to go.', 'Use à for destination and de for from/of.'],
    writing: ['Au and du are one-word contractions.', 'Aller has irregular forms.', 'À keeps its accent when not contracted.'],
    traps: ['Do not write à le or de le before masculine singular le.', 'Do not contract before la or l’.']
  },
  19: {
    concepts: ['ne-pas', 'etre-je-suis', 'negative-bracket', 'pas-placement'],
    build: ['Put ne before the conjugated verb and pas after it.', 'With two verbs, the negative surrounds the first verb.', 'Use je suis for I am.'],
    writing: ["Ne becomes n' before a vowel.", 'Pas is separate and comes after the conjugated verb.', 'Suis keeps final s silent.'],
    traps: ['Do not put pas at the end automatically.', 'Do not put ne before the infinitive in these modal patterns.']
  },
  20: {
    concepts: ['ne-peux-pas', 'trouver', 'garer', 'de-possession-review'],
    build: ['Build can’t as ne peux pas.', 'Place object pronouns before trouver when they are the thing found.', 'Use de for keys of the house/car.'],
    writing: ['Peux keeps x written.', 'Clés has accent and plural s.', 'Maison is feminine: la maison.'],
    traps: ['Do not forget both ne and pas.', 'Do not translate car keys with English word order.']
  },
  21: {
    concepts: ['chercher', 'possessives-notre-ma-ta', 'look-for-vs-find', 'family-nouns'],
    build: ['Use chercher for to look for/search.', 'Use trouver only when actually finding.', 'Choose possessives from the noun possessed.'],
    writing: ['Notre does not change for gender in the same way mon/ma does.', 'Chercher keeps ch spelling.', 'Ma/ta become mon/ton before vowels.'],
    traps: ['Do not use pour after chercher.', 'Do not confuse looking for with finding.']
  },
  22: {
    concepts: ['essayer-de', 'ou-where', 'etre-forms', 'from-here'],
    build: ['Use essayer de before an infinitive.', 'Use où for where.', 'Choose suis/es/est from the subject.'],
    writing: ['Où needs accent; ou without accent means or.', "D'ici contracts de + ici.", "J'essaye uses apostrophe before vowel."],
    traps: ['Do not drop de after essayer.', 'Do not confuse où and ou in dictation.']
  },
  23: {
    concepts: ['er-present-forms', 'ne-rien', 'present-tense-production', 'nothing'],
    build: ['Use present ER stems for I/you/he/she.', 'Build nothing as ne...rien.', 'Keep object pronouns before the verb.'],
    writing: ['Rien is separate after the verb.', 'Silent endings make several written forms sound alike.', 'Accents still matter in typed answers.'],
    traps: ['Do not use pas and rien together in standard practice.', 'Do not assume identical sound means identical spelling.']
  },
  24: {
    concepts: ['tu-form-er', 'habiter', 'second-person-s', 'location'],
    build: ['For tu ER verbs, write final -s even when silent.', 'Use habiter for to live.', 'Combine location phrases from earlier tracks.'],
    writing: ['Tu forms often have silent final s.', "J'habite contracts before h in writing here.", 'Près has accent grave.'],
    traps: ['Do not omit the written tu-form s.', 'Do not over-pronounce final s just because you type it.']
  },
  25: {
    concepts: ['lost-s-circumflex', 'arreter-de', 'reflexive-sarreter', 'etudier'],
    build: ['Use arrêter de for stop doing.', 'Use s’arrêter for stop oneself/come to a stop.', 'Notice old S patterns in école/hôpital/forêt.'],
    writing: ['Circumflex often marks a lost s: forêt/forest.', 'Arrêter has double r and accent.', "S'arrêter needs apostrophe before vowel."],
    traps: ['Do not use arrêter de and s’arrêter the same way.', 'Do not forget de before an infinitive after arrêter.']
  },
  26: {
    concepts: ['que-that', 'pourquoi', 'savoir-je-sais', 'subordinate-clause'],
    build: ['Use que for that in I know that...', 'Use pourquoi for why.', 'Use sais/sait forms for knowing a fact.'],
    writing: ['Pourquoi is one word.', 'Je sais ends with silent s.', "Qu'il/Qu'elle contracts que before a vowel."],
    traps: ['Do not use ce que when you only mean that.', 'Do not translate why as pour quoi in normal questions.']
  },
  27: {
    concepts: ['parler-a', 'f-to-p-shift', 'language-nouns', 'communication'],
    build: ['Use parler à for speaking to someone.', 'Use parler de for speaking about something.', 'Use lui/leur later for to him/her/them.'],
    writing: ['Parler is an ER infinitive.', 'Français has ç and accent.', 'À marks to in parler à.'],
    traps: ['Do not make parler take a direct object for people.', 'Do not confuse French the language with French nationality adjectives.']
  },
  28: {
    concepts: ['au-du-review', 'perdre', 're-verbs-intro', 'compound-locations'],
    build: ['Use perdre for to lose.', 'Use au/du contractions before masculine le.', 'Use RE verb logic as a new family.'],
    writing: ['Perdre keeps d in spelling though often silent in forms.', 'Au/du are one word.', 'Apartment/appartement has double p.'],
    traps: ['Do not write de le after losing something from the office.', 'Do not treat RE verbs exactly like ER verbs.']
  },
  29: {
    concepts: ['ils-veulent', 'ils-doivent', 'ils-peuvent', 'pour-infinitive'],
    build: ['Use ils forms for they.', 'Use pour + infinitive for in order to.', 'Keep modal + infinitive structure from earlier tracks.'],
    writing: ['Final -ent is silent in many they forms but written.', 'Veulent/peuvent/doivent have internal spelling changes.', 'Pour is separate before the infinitive.'],
    traps: ['Do not pronounce -ent as English ent.', 'Do not use pour when English to is just an infinitive after a modal.']
  },
  30: {
    concepts: ['silent-ent', 'sappeler', 'comment', 'oublier'],
    build: ['Use ils/elles + silent -ent for they verbs.', 'Use s’appeler for to be called.', 'Use comment for how/what in name questions.'],
    writing: ['Third-person plural -ent is written but silent.', "S'appeler uses apostrophe.", 'Oublier is linked to oblivion and keeps ou spelling.'],
    traps: ['Do not pronounce -ent.', 'Do not translate what is your name word-for-word.']
  },
  31: {
    concepts: ['faire', 'quest-ce-que', 'acheter', 'irregular-re-verb'],
    build: ['Use faire for do/make.', "Use qu'est-ce que for what questions.", 'Use acheter/achète vowel change in present forms.'],
    writing: ["Qu'est-ce que has apostrophe and hyphens.", 'Achète takes accent grave in the stressed form.', 'Faire has irregular spelling.'],
    traps: ['Do not invert again after qu’est-ce que.', 'Do not confuse faire with fabriquer for every make context.']
  },
  32: {
    concepts: ['ce-que', 'parce-que', 'ne-que-only', 'partir'],
    build: ['Use ce que for what as the thing that.', 'Use parce que for because.', 'Use ne...que for only.'],
    writing: ['Parce que is two words.', 'Ce que is two words.', 'Ne...que brackets the verb and the limited element.'],
    traps: ['Do not use que alone when English means what.', 'Do not confuse ne...que with a normal negative.']
  },
  33: {
    concepts: ['cest-vs-il-est', 'adjective-agreement', 'ement-adverbs', 'situation-vs-noun'],
    build: ['Use c’est for a situation or unnamed thing.', 'Use il/elle est for a specific noun.', 'Add agreement to adjectives and build -ément adverbs.'],
    writing: ['C’est contracts ce + est.', 'Feminine adjective e can reveal a final consonant.', '-ément adverbs often carry accent.'],
    traps: ['Do not use il est for every English it is.', 'Do not forget adjective agreement in writing.']
  },
  34: {
    concepts: ['re-verbs-je-tu', 'jamais', 'attendre', 'faire-present'],
    build: ['For je/tu RE verbs, remove -re and add written -s.', 'Use ne...jamais for never.', 'Use attendre without an extra for.'],
    writing: ['Je fais and tu fais look identical.', 'Attends has silent ds.', 'Jamais stays after the verb.'],
    traps: ['Do not add pas with jamais in standard practice.', 'Do not omit written final s in je/tu RE forms.']
  },
  35: {
    concepts: ['re-verbs-il-elle', 'vendre', 'perdre', 'tout-le-temps'],
    build: ['For il/elle RE verbs, use the stem with no added ending.', 'Use vend/perd/attend for he/she.', 'Use tout le temps for all the time.'],
    writing: ['Il vend and il perd keep final d written but silent.', 'Ils vendent makes the d audible before silent -ent.', 'Toujours is one word.'],
    traps: ['Do not add a written s to il/elle RE forms.', 'Do not pronounce final d in singular forms.']
  },
  36: {
    concepts: ['nous-ons', 'se-demander', 'si-if', 'comprendre-family'],
    build: ['Use nous + -ons for we.', 'Use se demander for wonder.', 'Use si to introduce if clauses.'],
    writing: ['Nous forms add audible/written -ons.', 'Nous nous can appear in reflexive forms.', 'Comprendre keeps prendre spelling.'],
    traps: ['Do not avoid nous nous when the verb is reflexive.', 'Do not use oui for if; use si in these clauses.']
  },
  37: {
    concepts: ['indirect-pronouns-lui-leur', 'direct-vs-indirect', 'cuisiner', 'parler-to'],
    build: ['Ask whether English can use to before the person.', 'Use lui/leur for to him/her/them.', 'Keep le/la/les for direct objects.'],
    writing: ['Lui and leur do not show gender.', 'Leur as pronoun has no s.', 'Cuisiner has cuisine spelling.'],
    traps: ['Do not use le/la after verbs that mean to someone.', 'Do not add an s to leur when it is the pronoun.']
  },
  38: {
    concepts: ['aller-future', 'vais-vas-va', 'days-of-week', 'near-future'],
    build: ['Use aller + infinitive for going-to future.', 'Choose vais/vas/va/allons from the subject.', 'Keep the future action verb in the infinitive.'],
    writing: ['Je vais has final s silent.', 'Days like lundi/vendredi are lowercase in French.', 'Demain is tomorrow.'],
    traps: ['Do not conjugate the second verb after aller.', 'Do not treat going to a place and going to do as the same structure without checking the next word.']
  },
  39: {
    concepts: ['passe-compose-er', 'avoir-helper', 'past-participle-e', 'already-not-yet'],
    build: ['Use avoir as the helper for these past-tense sentences.', 'For ER verbs, replace -er with -é.', 'Place pronouns before the helper when needed.'],
    writing: ['Past participle -é is not the same spelling as -er.', "J'ai contracts je + ai.", 'Déjà and pas encore need accents/spaces.'],
    traps: ['Do not use the infinitive for the past participle.', 'Do not place pas around the participle; bracket the helper.']
  },
  40: {
    concepts: ['passe-compose-re', 'past-participle-u', 'participle-as-adjective', 'perdu-vendu'],
    build: ['For RE past participles, remove -re and add -u.', 'Use avoir for compound past in these practice sentences.', 'Use être + participle as an adjective for states like lost/sold.'],
    writing: ['Perdu/vendu end in written u.', 'Adjectival participles can agree: perdue/vendue.', 'Quand l’ont-ils perdu has contraction and inversion.'],
    traps: ['Do not use -é for RE past participles.', 'Do not ignore agreement when the participle is functioning as an adjective.']
  }
};

const extraExercises = {
  1: [
    { en: 'I want the solution.', fr: 'Je veux la solution.', c: true },
    { en: 'Do you want the confirmation?', fr: 'Tu veux la confirmation ?', c: true },
    { en: 'I want the organisation.', fr: "Je veux l'organisation.", c: true },
    { en: 'Do you want the cake?', fr: 'Tu veux le gâteau ?', c: true },
    { en: 'Do you want it? (masc.)', fr: 'Tu le veux ?', c: true }
  ],
  2: [
    { en: 'I want to reserve something.', fr: 'Je veux réserver quelque chose.', c: true },
    { en: 'Do you want to observe the tradition?', fr: 'Tu veux observer la tradition ?', c: true },
    { en: 'I want to invite the organisation.', fr: "Je veux inviter l'organisation.", c: true },
    { en: 'Do you want to transform the solution?', fr: 'Tu veux transformer la solution ?', c: true },
    { en: 'I want to explore a little and participate.', fr: 'Je veux explorer un peu et participer.', c: true }
  ],
  3: [
    { en: 'Can you confirm the reservation?', fr: 'Tu peux confirmer la réservation ?', c: true },
    { en: 'I can recommend the coffee.', fr: 'Je peux recommander le café.', c: true },
    { en: 'Do you want to ask something?', fr: 'Tu veux demander quelque chose ?', c: true },
    { en: 'I want to order it, but I cannot.', fr: 'Je veux le commander, mais je ne peux pas.', c: true },
    { en: 'Can you compare the solution and the tradition?', fr: 'Tu peux comparer la solution et la tradition ?', c: true }
  ],
  4: [
    { en: 'Can you close it?', fr: 'Peux-tu le fermer ?', c: true },
    { en: 'Can I confirm the reservation?', fr: 'Puis-je confirmer la réservation ?', c: true },
    { en: 'Do you want to recommend something later?', fr: 'Veux-tu recommander quelque chose plus tard ?', c: true },
    { en: 'Can you close the door and confirm it?', fr: 'Peux-tu fermer la porte et le confirmer ?', c: true },
    { en: 'Do you want to organise the celebration?', fr: 'Veux-tu organiser la célébration ?', c: true }
  ],
  5: [
    { en: 'Can you explain it a little later?', fr: "Peux-tu l'expliquer un peu plus tard ?", c: true },
    { en: 'I want to lock it (the door) later.', fr: 'Je veux la fermer à clé plus tard.', c: true },
    { en: 'Do you want a little coffee later?', fr: 'Veux-tu un peu de café plus tard ?', c: true },
    { en: 'Can you duplicate it and explain it?', fr: "Peux-tu le dupliquer et l'expliquer ?", c: true },
    { en: 'I must duplicate the confirmation later.', fr: 'Je dois dupliquer la confirmation plus tard.', c: true }
  ],
  6: [
    { en: 'I must prepare the car now.', fr: 'Je dois préparer la voiture maintenant.', c: true },
    { en: 'You must repair it later.', fr: 'Tu dois la réparer plus tard.', c: true },
    { en: 'Can you compare the cars?', fr: 'Peux-tu comparer les voitures ?', c: true },
    { en: 'I owe you thirty euros.', fr: 'Je te dois trente euros.', c: true },
    { en: 'I must reserve the car and prepare it.', fr: 'Je dois réserver la voiture et la préparer.', c: true }
  ],
  7: [
    { en: 'I must reserve the train now.', fr: 'Je dois réserver le train maintenant.', c: true },
    { en: 'Can you recommend the bus or the train?', fr: 'Peux-tu recommander le bus ou le train ?', c: true },
    { en: 'You must confirm the visit on time.', fr: 'Tu dois confirmer la visite à temps.', c: true },
    { en: 'I want to take the bus later.', fr: 'Je veux prendre le bus plus tard.', c: true },
    { en: 'Can you maintain the organisation on time?', fr: "Peux-tu maintenir l'organisation à temps ?", c: true }
  ],
  8: [
    { en: 'I must repair it before the visit.', fr: 'Je dois le réparer avant la visite.', c: true },
    { en: 'Can you organise it on time?', fr: "Peux-tu l'organiser à temps ?", c: true },
    { en: 'I want to prepare the bicycle later.', fr: 'Je veux préparer la bicyclette plus tard.', c: true },
    { en: 'You must confirm it now.', fr: 'Tu dois le confirmer maintenant.', c: true },
    { en: 'Do you want to prepare it and close it?', fr: 'Veux-tu la préparer et la fermer ?', c: true }
  ],
  9: [
    { en: 'Can you invite me to the party?', fr: "Peux-tu m'inviter à la fête ?", c: true },
    { en: 'I want to see you later.', fr: 'Je veux te voir plus tard.', c: true },
    { en: 'She wants to see me now.', fr: 'Elle veut me voir maintenant.', c: true },
    { en: 'I must invite her and see him.', fr: "Je dois l'inviter et le voir.", c: true },
    { en: 'Do you want to invite me or invite her?', fr: "Veux-tu m'inviter ou l'inviter ?", c: true }
  ],
  10: [
    { en: 'Do you want a black car?', fr: 'Veux-tu une voiture noire ?', c: true },
    { en: 'She wants a black baguette.', fr: 'Elle veut une baguette noire.', c: true },
    { en: 'Can you introduce my friend?', fr: 'Peux-tu présenter mon ami ?', c: true },
    { en: 'I must prepare a black coffee now.', fr: 'Je dois préparer un café noir maintenant.', c: true },
    { en: 'Do you want a black bicycle or a baguette?', fr: 'Veux-tu une bicyclette noire ou une baguette ?', c: true }
  ],
  11: [
    { en: 'She wants to invite you to the birthday party.', fr: "Elle veut t'inviter à la fête d'anniversaire.", c: true },
    { en: 'He can confirm the ordinary reservation.', fr: 'Il peut confirmer la réservation ordinaire.', c: true },
    { en: 'She must repair it now.', fr: 'Elle doit le réparer maintenant.', c: true },
    { en: 'He wants to organise it, but he cannot.', fr: "Il veut l'organiser, mais il ne peut pas.", c: true },
    { en: 'She can recommend a popular documentary.', fr: 'Elle peut recommander un documentaire populaire.', c: true }
  ],
  12: [
    { en: 'I must get ready before the party.', fr: 'Je dois me préparer avant la fête.', c: true },
    { en: 'Can you get ready now?', fr: 'Peux-tu te préparer maintenant ?', c: true },
    { en: 'She wants to relax a little later.', fr: 'Elle veut se relaxer un peu plus tard.', c: true },
    { en: 'He must get up and prepare the mobile.', fr: 'Il doit se lever et préparer le portable.', c: true },
    { en: 'I want to see you, but I must get ready.', fr: 'Je veux te voir, mais je dois me préparer.', c: true }
  ],
  13: [
    { en: 'Can you bring the wallet back?', fr: 'Peux-tu rapporter le portefeuille ?', c: true },
    { en: 'I must take the car away now.', fr: 'Je dois emporter la voiture maintenant.', c: true },
    { en: 'She wants to carry the black baguette.', fr: 'Elle veut porter la baguette noire.', c: true },
    { en: 'He can bring something for the party.', fr: 'Il peut apporter quelque chose pour la fête.', c: true },
    { en: 'I cannot tolerate it, but I can explain it.', fr: "Je ne peux pas le supporter, mais je peux l'expliquer.", c: true }
  ],
  14: [
    { en: 'I must seize the opportunity now.', fr: "Je dois saisir l'opportunité maintenant.", c: true },
    { en: 'She cannot tolerate the reality.', fr: 'Elle ne peut pas supporter la réalité.', c: true },
    { en: 'Do you want to transport something for the party?', fr: 'Veux-tu transporter quelque chose pour la fête ?', c: true },
    { en: 'He must behave well at the party.', fr: 'Il doit bien se comporter à la fête.', c: true },
    { en: 'I want to compare the quality and the possibility.', fr: 'Je veux comparer la qualité et la possibilité.', c: true }
  ],
  15: [
    { en: 'Everybody wants to see my friend.', fr: 'Tout le monde veut voir mon ami.', c: true },
    { en: 'My friend must invite your wife.', fr: 'Mon ami doit inviter ta femme.', c: true },
    { en: 'I want your mobile, but everybody wants our car.', fr: 'Je veux ton portable, mais tout le monde veut notre voiture.', c: true },
    { en: 'Everybody must get ready on time.', fr: 'Tout le monde doit se préparer à temps.', c: true },
    { en: 'My friend cannot find your car.', fr: 'Mon ami ne peut pas trouver ta voiture.', c: true }
  ],
  16: [
    { en: 'I must wait for them at the station.', fr: 'Je dois les attendre à la gare.', c: true },
    { en: 'Can I choose them now?', fr: 'Puis-je les choisir maintenant ?', c: true },
    { en: 'He wants to defend them, but he cannot.', fr: 'Il veut les défendre, mais il ne peut pas.', c: true },
    { en: 'Everybody wants to finish it before the party.', fr: 'Tout le monde veut le finir avant la fête.', c: true },
    { en: 'I can see them and invite them.', fr: 'Je peux les voir et les inviter.', c: true }
  ],
  17: [
    { en: 'I can google the invitations.', fr: 'Je peux googler les invitations.', c: true },
    { en: 'She wants to stream the documentary.', fr: 'Elle veut streamer le documentaire.', c: true },
    { en: 'Can you confirm the cars and reserve them?', fr: 'Peux-tu confirmer les voitures et les réserver ?', c: true },
    { en: 'They want the mobiles, but I want the invitations.', fr: 'Ils veulent les portables, mais je veux les invitations.', c: true },
    { en: 'I must tweet it and invite them.', fr: 'Je dois le tweeter et les inviter.', c: true }
  ],
  18: [
    { en: 'I must go to the office to see my husband.', fr: 'Je dois aller au bureau pour voir mon mari.', c: true },
    { en: 'She wants to go to the station now.', fr: 'Elle veut aller à la gare maintenant.', c: true },
    { en: 'My husband can go to the garage to repair the car.', fr: 'Mon mari peut aller au garage pour réparer la voiture.', c: true },
    { en: 'Do you want to go to the village later?', fr: 'Veux-tu aller au village plus tard ?', c: true },
    { en: 'I must go from the village to the office.', fr: 'Je dois aller du village au bureau.', c: true }
  ],
  19: [
    { en: "I don't want to show you the message.", fr: 'Je ne veux pas te montrer le message.', c: true },
    { en: "I'm not from here, but I'm passing through.", fr: "Je ne suis pas d'ici, mais je suis de passage.", c: true },
    { en: "He mustn't close the door now.", fr: 'Il ne doit pas fermer la porte maintenant.', c: true },
    { en: "I can't send it because I'm passing through.", fr: "Je ne peux pas l'envoyer parce que je suis de passage.", c: true },
    { en: "She doesn't want to eat before the visit.", fr: 'Elle ne veut pas manger avant la visite.', c: true }
  ],
  20: [
    { en: "I can't find the car key.", fr: 'Je ne peux pas trouver la clé de la voiture.', c: true },
    { en: "She can't park it now.", fr: 'Elle ne peut pas la garer maintenant.', c: true },
    { en: "Can you find the house keys?", fr: 'Peux-tu trouver les clés de la maison ?', c: true },
    { en: "He can't find them, but he must go to the garage.", fr: 'Il ne peut pas les trouver, mais il doit aller au garage.', c: true },
    { en: "I can't park it because I can't find the key.", fr: 'Je ne peux pas la garer parce que je ne peux pas trouver la clé.', c: true }
  ],
  21: [
    { en: 'Can you look for my wife at the station?', fr: 'Peux-tu chercher ma femme à la gare ?', c: true },
    { en: "I can't find our car; can you look for it?", fr: 'Je ne peux pas trouver notre voiture ; peux-tu la chercher ?', c: true },
    { en: 'She wants to send her message to my friend.', fr: 'Elle veut envoyer son message à mon ami.', c: true },
    { en: 'He is looking for his mobile, but it is in the car.', fr: 'Il cherche son portable, mais il est dans la voiture.', c: true },
    { en: 'I must look up the reservation and confirm it.', fr: 'Je dois rechercher la réservation et la confirmer.', c: true }
  ],
  22: [
    { en: "I'm trying to find my mobile.", fr: "J'essaye de trouver mon portable.", c: true },
    { en: 'Where is your wife from?', fr: "Ta femme est d'où ?", c: true },
    { en: 'Where is he? I am trying to see him.', fr: "Où est-il ? J'essaye de le voir.", c: true },
    { en: "She isn't from here, but she lives here.", fr: "Elle n'est pas d'ici, mais elle habite ici.", c: true },
    { en: 'I am trying to send it. Where is the message?', fr: "J'essaye de l'envoyer. Où est le message ?", c: true }
  ],
  23: [
    { en: "I don't eat anything before the party.", fr: 'Je ne mange rien avant la fête.', c: true },
    { en: "She doesn't regret anything, but she doesn't want to come.", fr: 'Elle ne regrette rien, mais elle ne veut pas venir.', c: true },
    { en: 'He eats here, but he lives there.', fr: 'Il mange ici, mais il habite là.', c: true },
    { en: 'Do you eat something before the visit?', fr: 'Tu manges quelque chose avant la visite ?', c: true },
    { en: "I don't want to eat anything because I must leave.", fr: 'Je ne veux rien manger parce que je dois partir.', c: true }
  ],
  24: [
    { en: 'Where do you live now?', fr: 'Tu habites où maintenant ?', c: true },
    { en: "I live near the station, but I don't eat there.", fr: "J'habite près de la gare, mais je ne mange pas là.", c: true },
    { en: 'You eat here every day.', fr: 'Tu manges ici tous les jours.', c: true },
    { en: "He doesn't live near the school.", fr: "Il n'habite pas près de l'école.", c: true },
    { en: 'Do you live near the hospital or near the station?', fr: "Tu habites près de l'hôpital ou près de la gare ?", c: true }
  ],
  25: [
    { en: "I'm stopping here because I live near the school.", fr: "Je m'arrête ici parce que j'habite près de l'école.", c: true },
    { en: 'She wants to quit smoking before the party.', fr: 'Elle veut arrêter de fumer avant la fête.', c: true },
    { en: 'Do you study near the hospital?', fr: "Tu étudies près de l'hôpital ?", c: true },
    { en: "He stops at the coast, but he doesn't study there.", fr: "Il s'arrête à la côte, mais il n'étudie pas là.", c: true },
    { en: 'I must stop studying now.', fr: "Je dois arrêter d'étudier maintenant.", c: true }
  ],
  26: [
    { en: "I know that she wants to come back.", fr: "Je sais qu'elle veut revenir.", c: true },
    { en: "Why don't they want to come?", fr: 'Pourquoi ils ne veulent pas venir ?', c: true },
    { en: "I don't know what you are eating.", fr: 'Je ne sais pas ce que tu manges.', c: true },
    { en: 'He knows that she must come back soon.', fr: "Il sait qu'elle doit revenir bientôt.", c: true },
    { en: 'Do you know why she only speaks French?', fr: 'Tu sais pourquoi elle ne parle que le français ?', c: true }
  ],
  27: [
    { en: "I speak French a little, but I don't know everything.", fr: 'Je parle un peu français, mais je ne sais pas tout.', c: true },
    { en: 'What are you talking about with my father?', fr: 'De quoi parles-tu avec mon père ?', c: true },
    { en: "She speaks to my father because she doesn't know where I am.", fr: "Elle parle à mon père parce qu'elle ne sait pas où je suis.", c: true },
    { en: "I don't want to go home on foot tonight.", fr: 'Je ne veux pas aller à la maison à pied ce soir.', c: true },
    { en: 'They want to eat fish, but they cannot find the fish.', fr: 'Ils veulent manger du poisson, mais ils ne peuvent pas trouver le poisson.', c: true }
  ],
  28: [
    { en: "They don't want to lose the messages.", fr: 'Ils ne veulent pas perdre les messages.', c: true },
    { en: 'Can you taste it before the visit?', fr: 'Peux-tu le goûter avant la visite ?', c: true },
    { en: "They are going to the station because they can't wait here.", fr: "Ils vont à la gare parce qu'ils ne peuvent pas attendre ici.", c: true },
    { en: 'She cannot go there on foot.', fr: 'Elle ne peut pas y aller à pied.', c: true },
    { en: 'I want to send some messages to the friends.', fr: 'Je veux envoyer des messages aux amis.', c: true }
  ],
  29: [
    { en: 'They want to come to the office to pay.', fr: 'Ils veulent venir au bureau pour payer.', c: true },
    { en: 'They can wait at the station to speak to my father.', fr: 'Ils peuvent attendre à la gare pour parler à mon père.', c: true },
    { en: 'Why do they want to come back tonight?', fr: 'Pourquoi ils veulent revenir ce soir ?', c: true },
    { en: 'They can speak to my father to explain the problem.', fr: 'Ils peuvent parler à mon père pour expliquer le problème.', c: true },
    { en: 'Why must they go to the village?', fr: 'Pourquoi ils doivent aller au village ?', c: true }
  ],
  30: [
    { en: 'What are they called?', fr: "Comment ils s'appellent ?", c: true },
    { en: 'They always forget to pay.', fr: 'Ils oublient toujours de payer.', c: true },
    { en: 'My name is Thomas, but he always forgets it.', fr: "Je m'appelle Thomas, mais il l'oublie toujours.", c: true },
    { en: "They live in an apartment near the station.", fr: 'Ils habitent dans un appartement près de la gare.', c: true },
    { en: "He forgets everything, but they don't forget anything.", fr: "Il oublie tout, mais ils n'oublient rien.", c: true }
  ],
  31: [
    { en: 'What do you want to buy for the party?', fr: "Qu'est-ce que tu veux acheter pour la fête ?", c: true },
    { en: "I can't do it tonight because I must leave.", fr: 'Je ne peux pas le faire ce soir parce que je dois partir.', c: true },
    { en: 'She buys it because she wants it.', fr: "Elle l'achète parce qu'elle le veut.", c: true },
    { en: 'What are they doing at the office?', fr: "Qu'est-ce qu'ils font au bureau ?", c: true },
    { en: 'I know that you want to redo it.', fr: 'Je sais que tu veux le refaire.', c: true }
  ],
  32: [
    { en: 'I know what she wants to buy.', fr: "Je sais ce qu'elle veut acheter.", c: true },
    { en: 'He only eats fish because he is leaving soon.', fr: "Il ne mange que du poisson parce qu'il part bientôt.", c: true },
    { en: 'Do you know what we must do tonight?', fr: 'Tu sais ce que nous devons faire ce soir ?', c: true },
    { en: "I can't leave because I'm waiting for my friend.", fr: "Je ne peux pas partir parce que j'attends mon ami.", c: true },
    { en: 'What is bigger than the apartment?', fr: "Qu'est-ce qui est plus grand que l'appartement ?", c: true }
  ],
  33: [
    { en: "It's urgent, but it's not important.", fr: "C'est urgent, mais ce n'est pas important.", c: true },
    { en: 'The car is too big and totally black.', fr: 'La voiture est trop grande et totalement noire.', c: true },
    { en: 'Normally she is punctual, but today she is late.', fr: "Normalement elle est ponctuelle, mais aujourd'hui elle est en retard.", c: true },
    { en: "He is arrogant, but it's not the problem.", fr: "Il est arrogant, mais ce n'est pas le problème.", c: true },
    { en: 'They are different, but everything is perfectly legal.', fr: 'Ils sont différents, mais tout est parfaitement légal.', c: true }
  ],
  34: [
    { en: "I'm waiting for you, but you never come.", fr: "Je t'attends, mais tu ne viens jamais.", c: true },
    { en: 'You never do what you must do.', fr: 'Tu ne fais jamais ce que tu dois faire.', c: true },
    { en: "I don't lose anything tonight.", fr: 'Je ne perds rien ce soir.', c: true },
    { en: "If ever you wait, I'm leaving.", fr: "Si jamais tu attends, je pars.", c: true },
    { en: 'What are you doing? I am not doing anything.', fr: "Qu'est-ce que tu fais ? Je ne fais rien.", c: true }
  ],
  35: [
    { en: 'He sells the car because he always loses the keys.', fr: "Il vend la voiture parce qu'il perd toujours les clés.", c: true },
    { en: 'She waits all the time, but he never waits.', fr: "Elle attend tout le temps, mais il n'attend jamais.", c: true },
    { en: 'They lose everything and they sell nothing.', fr: 'Ils perdent tout et ils ne vendent rien.', c: true },
    { en: 'He is selling his mobile, but he is not selling the car.', fr: 'Il vend son portable, mais il ne vend pas la voiture.', c: true },
    { en: 'She loses again, but everybody still wants to play.', fr: 'Elle perd encore, mais tout le monde veut toujours jouer.', c: true }
  ],
  36: [
    { en: 'We wonder if they understand.', fr: "Nous nous demandons s'ils comprennent.", c: true },
    { en: 'We sell the car because we are leaving soon.', fr: 'Nous vendons la voiture parce que nous partons bientôt.', c: true },
    { en: 'I wonder if we can learn it today.', fr: "Je me demande si nous pouvons l'apprendre aujourd'hui.", c: true },
    { en: 'We understand what you want, but we cannot do it.', fr: 'Nous comprenons ce que tu veux, mais nous ne pouvons pas le faire.', c: true },
    { en: 'We are eating now and we are leaving later.', fr: 'Nous mangeons maintenant et nous partons plus tard.', c: true }
  ],
  37: [
    { en: 'I want to send him the message now.', fr: 'Je veux lui envoyer le message maintenant.', c: true },
    { en: 'Can we cook them something tonight?', fr: 'Nous pouvons leur cuisiner quelque chose ce soir ?', c: true },
    { en: 'She speaks to him, but he does not want to speak to her.', fr: 'Elle lui parle, mais il ne veut pas lui parler.', c: true },
    { en: 'They sell us a car, but we cannot buy it.', fr: "Ils nous vendent une voiture, mais nous ne pouvons pas l'acheter.", c: true },
    { en: 'I want to see them, but I want to speak to them first.', fr: "Je veux les voir, mais je veux leur parler d'abord.", c: true }
  ],
  38: [
    { en: 'I am going to buy it tomorrow.', fr: "Je vais l'acheter demain.", c: true },
    { en: 'Are you going to speak to my father on Friday?', fr: 'Tu vas parler à mon père vendredi ?', c: true },
    { en: 'We are going to ask them why they are leaving.', fr: 'Nous allons leur demander pourquoi ils partent.', c: true },
    { en: 'She is going to organise the party, but not tonight.', fr: 'Elle va organiser la fête, mais pas ce soir.', c: true },
    { en: 'He is going to lose the keys if he waits here.', fr: "Il va perdre les clés s'il attend ici.", c: true }
  ],
  39: [
    { en: "I haven't paid yet, but I have already eaten.", fr: "Je n'ai pas encore payé, mais j'ai déjà mangé.", c: true },
    { en: 'Have you cooked something for them?', fr: 'Tu leur as cuisiné quelque chose ?', c: true },
    { en: 'She has reserved the car and found the keys.', fr: 'Elle a réservé la voiture et trouvé les clés.', c: true },
    { en: "We have organised the party, but they haven't eaten yet.", fr: "Nous avons organisé la fête, mais ils n'ont pas encore mangé.", c: true },
    { en: 'I sent him a message, but he has not found it.', fr: "Je lui ai envoyé un message, mais il ne l'a pas trouvé.", c: true }
  ],
  40: [
    { en: 'We have lost the keys again.', fr: 'Nous avons encore perdu les clés.', c: true },
    { en: 'Have they sold the car already?', fr: 'Ils ont déjà vendu la voiture ?', c: true },
    { en: 'I am totally lost, but I understood the question.', fr: "Je suis totalement perdu, mais j'ai compris la question.", c: true },
    { en: 'When did you lose it?', fr: "Quand l'as-tu perdu ?", c: true },
    { en: 'The house is sold, but the car is not sold yet.', fr: "La maison est vendue, mais la voiture n'est pas encore vendue.", c: true }
  ]
};

const deprecatedExerciseAnswers = {
  5: ['Je veux fermer la porte à clé maintenant.'],
  14: ['Veux-tu transporter quelque chose dimportant ?'],
  15: ['Ton portable est ici, mais notre voiture est là.'],
  18: [
    'Je dois aller au bureau pour envoyer le message.',
    "Je viens du village, mais j'habite près de la gare."
  ],
  19: ["Je ne suis pas d'ici, mais j'habite ici."],
  20: ["Je ne peux pas garer la voiture parce que j'ai perdu la clé."],
  26: ['Il sait que nous devons partir bientôt.'],
  27: [
    'Je parle un peu français, mais je ne comprends pas tout.',
    'Ils veulent pêcher, mais ils ne peuvent pas trouver le poisson.'
  ],
  30: ['Ils oublient de payer chaque fois.'],
  31: ["Elle l'achète parce que c'est parfait."],
  35: ['Il vend son portable, mais il est déjà vendu.'],
  37: [
    'Pouvons-nous leur cuisiner quelque chose ce soir ?',
    'Elle lui parle, mais il ne lui répond pas.',
    'Je les vois, mais je veux leur parler.'
  ],
  39: [
    'Nous avons organisé la fête, mais ils ne sont pas encore venus.',
    "Je lui ai envoyé un message, mais il n'a pas répondu."
  ]
};

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferConcepts(en, fr, base) {
  const text = `${en} ${fr}`.toLowerCase();
  const french = fr.toLowerCase();
  const infinitive = '[a-zà-ÿ]+(?:er|ir|oir|re)';
  const modal = '(?:veux-tu|peux-tu|puis-je|veux|veut|peux|peut|dois|doit|devons|pouvons|doivent|peuvent|veulent)';
  const modalInfinitive = new RegExp(`(?:^|[\\s-])${modal}\\s+(?:pas\\s+)?(?:me\\s+|te\\s+|se\\s+|nous\\s+|vous\\s+|le\\s+|la\\s+|les\\s+|[mtls]')?${infinitive}(?=$|[\\s?.!,;])`);
  const pronounInfinitive = new RegExp(`(?:^|[\\s-])(?:me|te|se|nous|vous)\\s+${infinitive}(?=$|[\\s?.!,;])|(?:^|[\\s-])[mtls]'${infinitive}(?=$|[\\s?.!,;])|(?:^|[\\s-])${modal}\\s+(?:pas\\s+)?(?:le|la|les)\\s+${infinitive}(?=$|[\\s?.!,;])`);
  const pronounBeforeFinite = /(?:^|\s)(?:je|tu|il|elle|on|nous|vous|ils|elles)\s+(?:me|te|se|nous|vous|le|la|les)\s+[a-zà-ÿ]+/;
  const concepts = [...base];
  if (/[?]/.test(fr) || /\b(what|where|why|when|how|can you|do you)\b/i.test(en)) concepts.push('question-formation');
  if (/\bne |n'/.test(french) || /\bpas\b|\brien\b|\bjamais\b/.test(french)) concepts.push('negation');
  if (modalInfinitive.test(french)) concepts.push('modal-plus-infinitive');
  if (pronounInfinitive.test(french) || pronounBeforeFinite.test(french)) concepts.push('pronoun-placement');
  if (/\bmon\b|\bma\b|\bton\b|\bta\b|\bson\b|\bsa\b|\bnotre\b|\bnos\b/.test(french)) concepts.push('possessives');
  if (/\bde\s+[a-zà-ÿ]+(?:er|ir|oir|re)\b|\bd'\s*[a-zà-ÿ]+(?:er|ir|oir|re)\b/.test(french)) concepts.push('de-before-infinitive');
  if (/\bpour\s+[a-zà-ÿ]+(?:er|ir|oir|re)\b/.test(french)) concepts.push('pour-before-infinitive');
  if (/\bvais\b|\bvas\b|\bva\b|\ballons\b/.test(french)) concepts.push('near-future');
  if (/\b(?:ai|as|a|avons|avez|ont)\b/.test(french) && /\b[a-zà-ÿ]+(?:é|u|is)\b/.test(french)) concepts.push('passe-compose');
  if (/(?:^|[\s-])(?:me|te|se)\s|(?:^|[\s-])[mts]'/.test(french)) concepts.push('reflexive-or-object-pronoun');
  return uniq(concepts).slice(0, 8);
}

function writingNotes(fr, meta) {
  const notes = [...meta.writing.slice(0, 2)];
  if (/[éèêàùûîôçœ]/i.test(fr)) notes.push('Type the accent marks; dictation practice is for written French too.');
  if (fr.includes("'")) notes.push('Use the apostrophe where French contracts before a vowel.');
  if (/\bils? .+ent\b/i.test(fr) || /\belles? .+ent\b/i.test(fr)) notes.push('Watch written -ent; it is often silent.');
  if (/\b(peux|veux|dois|suis|fais|perds|vends|attends)\b/i.test(fr)) notes.push('Several final consonants are written but silent.');
  if (fr.includes('?')) notes.push('Keep French question punctuation and any inversion hyphen.');
  return uniq(notes).slice(0, 4);
}

function buildSteps(en, fr, meta, concepts) {
  const steps = [
    meta.build[0],
    meta.build[1],
  ];
  if (concepts.includes('negation')) steps.push('Place ne/n’ before the conjugated verb and the second negative word after it.');
  if (concepts.includes('pronoun-placement')) steps.push('Place the object pronoun before the verb it belongs to.');
  if (concepts.includes('question-formation')) steps.push('Choose the question shape before building the sentence.');
  if (concepts.includes('de-before-infinitive')) steps.push('Keep de before the infinitive because this verb or phrase requires it.');
  if (concepts.includes('passe-compose')) steps.push('Build the past with helper + past participle, not with the infinitive.');
  steps.push('Say the complete French sentence aloud before typing it.');
  return uniq(steps).slice(0, 5);
}

function hintFor(en, fr, meta, concepts) {
  const focus = concepts.slice(0, 3).join(', ');
  return `Build it through ${meta.concepts[0]}${focus ? ` and review: ${focus}` : ''}. Say it aloud first, then type the exact French.`;
}

for (const [id, track] of Object.entries(tracks)) {
  const meta = trackMeta[id];
  if (!meta) throw new Error(`Missing metadata for track ${id}`);
  if (!Array.isArray(exercises[id])) throw new Error(`Missing exercises for track ${id}`);
  track.concepts = meta.concepts;
  track.notes = {
    build: meta.build,
    writing: meta.writing,
    traps: meta.traps
  };
  const deprecatedAnswers = new Set(deprecatedExerciseAnswers[id] ?? []);
  const merged = exercises[id].filter(ex => !deprecatedAnswers.has(ex.fr));
  const curatedAnswers = new Set();
  const existingAnswers = new Set(merged.map(ex => ex.fr));
  for (const ex of extraExercises[id] ?? []) {
    if (curatedAnswers.has(ex.fr)) throw new Error(`Duplicate curated answer for track ${id}: ${ex.fr}`);
    curatedAnswers.add(ex.fr);
    if (!existingAnswers.has(ex.fr)) {
      merged.push(ex);
      existingAnswers.add(ex.fr);
    }
  }
  exercises[id] = merged.map(ex => {
    const concepts = inferConcepts(ex.en, ex.fr, meta.concepts);
    return {
      ...ex,
      hint: ex.hint || hintFor(ex.en, ex.fr, meta, concepts),
      concepts,
      steps: ex.steps || buildSteps(ex.en, ex.fr, meta, concepts),
      writing: ex.writing || writingNotes(ex.fr, meta)
    };
  });
}

await writeFile(tracksPath, JSON.stringify(tracks));
await writeFile(exercisesPath, JSON.stringify(exercises));
console.log(`Enriched ${Object.keys(tracks).length} tracks and ${Object.values(exercises).reduce((sum, list) => sum + list.length, 0)} exercises.`);
