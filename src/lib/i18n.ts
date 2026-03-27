import type { AppView } from '../types/dictionary'

export type UiLanguage = 'en' | 'de' | 'fr'

type UiCopy = {
  appName: string
  dashboard: string
  reader: string
  wordBank: string
  quizBuilder: string
  logout: string
  user: string
  signInTitle: string
  signInBody: string
  usernamePlaceholder: string
  continueButton: string
  dashboardTitle: string
  dashboardSubtitle: string
  openReader: string
  openWordBank: string
  openQuizBuilder: string
  slideReaderTitle: string
  slideReaderBody: string
  slideDictionaryTitle: string
  slideDictionaryBody: string
  slideRetentionTitle: string
  slideRetentionBody: string
  settings: string
  collapseSettings: string
  expandSettings: string
  fontSize: string
  lineHeight: string
  letterSpacing: string
  font: string
  language: string
  theme: string
  light: string
  dark: string
  pdfZoom: string
  textOpacity: string
  clearPdf: string
  dropPdf: string
  clickToBrowse: string
  restoringPdf: string
  parsingPdf: string
  lookupHint: string
  savedWords: string
  remove: string
  saveWord: string
  noEntryFound: string
  lookingUp: string
  pronunciation: string
  playAudio: string
  quickMeaning: string
  imageForWord: string
  etymology: string
  levelBeginner: string
  levelIntermediate: string
  levelAdvanced: string
  readerEmptyTitle: string
  readerEmptyBody: string
  wordBankEmpty: string
  practice: string
  test: string
  setsBySource: string
  tapToFlip: string
  wordType: string
  primaryDefinitions: string
  testInstruction: string
  yourAnswer: string
  check: string
  correct: string
  tryAgain: string
  reveal: string
  generalSet: string
  quizBuilderTitle: string
  quizBuilderSubtitle: string
  generatorOptions: string
  quizLanguage: string
  cefrLevel: string
  topic: string
  topicPlaceholder: string
  quizType: string
  numberOfQuestions: string
  optionsPerQuestion: string
  timePerQuestion: string
  titleOptional: string
  titlePlaceholder: string
  generateQuiz: string
  vocabulary: string
  grammar: string
  comprehension: string
  translation: string
  fillInTheBlank: string
  errorDetection: string
  generatedQuiz: string
  regenerateAll: string
  regenerate: string
  addQuestion: string
  launchSession: string
  editQuestion: string
  saveChanges: string
  cancel: string
  deleteQuestion: string
  moveUp: string
  moveDown: string
  explanationLabel: string
  correctAnswer: string
  optionLabel: string
  presenterView: string
  lobby: string
  startQuiz: string
  nextQuestion: string
  revealAnswer: string
  showLeaderboard: string
  finishQuiz: string
  backToBuilder: string
  participants: string
  joinLink: string
  sessionCode: string
  answerTiles: string
  questionLabel: string
  noQuizGenerated: string
  hostReady: string
  localSessionNote: string
  testOllama: string
  testingOllama: string
  ollamaReachable: string
  ollamaModelMissing: string
  ollamaSettings: string
  ollamaBaseUrl: string
  ollamaModel: string
  ollamaApiKey: string
  saveOllamaSettings: string
  ollamaSettingsSaved: string
  hostedOllamaHint: string
}

const COPY: Record<UiLanguage, UiCopy> = {
  en: {
    appName: 'LexiView',
    dashboard: 'Dashboard',
    reader: 'Reader',
    wordBank: 'Word Bank',
    quizBuilder: 'Quiz Builder',
    logout: 'Log out',
    user: 'User',
    signInTitle: 'Welcome to LexiView',
    signInBody: 'Create a local profile to save your words and reading level on this device.',
    usernamePlaceholder: 'Choose a username',
    continueButton: 'Continue',
    dashboardTitle: 'Read faster, remember better',
    dashboardSubtitle: 'Tap words in your PDFs, hear pronunciation, see simple definitions, and build your bank.',
    openReader: 'Open Reader',
    openWordBank: 'Open Word Bank',
    openQuizBuilder: 'Open Quiz Builder',
    slideReaderTitle: 'Reader',
    slideReaderBody: 'Upload a PDF and double-click any word for instant lookup.',
    slideDictionaryTitle: 'Smart Dictionary',
    slideDictionaryBody: 'Focus on English, German, and French with pronunciation and quick meaning.',
    slideRetentionTitle: 'Word Bank',
    slideRetentionBody: 'Save words and grow your reading level over time.',
    settings: 'Settings',
    collapseSettings: 'Hide settings',
    expandSettings: 'Show settings',
    fontSize: 'Font size',
    lineHeight: 'Line height',
    letterSpacing: 'Letter spacing',
    font: 'Font',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    pdfZoom: 'PDF zoom',
    textOpacity: 'Text opacity',
    clearPdf: 'Clear PDF',
    dropPdf: 'Drop PDF here',
    clickToBrowse: 'or click to browse',
    restoringPdf: 'Restoring last PDF...',
    parsingPdf: 'Parsing PDF...',
    lookupHint: 'Double-click or select a word to look it up',
    savedWords: 'Saved words',
    remove: 'Remove',
    saveWord: 'Save word',
    noEntryFound: 'No entry found.',
    lookingUp: 'Looking up',
    pronunciation: 'Pronunciation',
    playAudio: 'Play audio',
    quickMeaning: 'Quick meaning',
    imageForWord: 'Image',
    etymology: 'Etymology',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',
    readerEmptyTitle: 'Open Reader to start reading',
    readerEmptyBody: 'Use the top menu and choose Reader.',
    wordBankEmpty: 'No saved words yet.',
    practice: 'Practice',
    test: 'Test',
    setsBySource: 'Sets by source',
    tapToFlip: 'Tap card to flip',
    wordType: 'Word type',
    primaryDefinitions: 'Primary definitions',
    testInstruction: 'Type the word that matches the clue.',
    yourAnswer: 'Your answer',
    check: 'Check',
    correct: 'Correct',
    tryAgain: 'Try again',
    reveal: 'Reveal',
    generalSet: 'General Set',
    quizBuilderTitle: 'AI Quiz Generator',
    quizBuilderSubtitle: 'Set language, level, topic, and timing before generating your classroom quiz.',
    generatorOptions: 'Generator options',
    quizLanguage: 'Language',
    cefrLevel: 'CEFR level',
    topic: 'Topic',
    topicPlaceholder: 'Cafe vocabulary, subjunctive mood, climate change debate...',
    quizType: 'Quiz type',
    numberOfQuestions: 'Number of questions',
    optionsPerQuestion: 'Options per question',
    timePerQuestion: 'Time per question',
    titleOptional: 'Title (optional)',
    titlePlaceholder: 'Leave blank to auto-generate',
    generateQuiz: 'Generate Quiz ->',
    vocabulary: 'Vocabulary',
    grammar: 'Grammar',
    comprehension: 'Comprehension',
    translation: 'Translation',
    fillInTheBlank: 'Fill in the blank',
    errorDetection: 'Error detection',
    generatedQuiz: 'Generated quiz',
    regenerateAll: 'Regenerate All',
    regenerate: 'Regenerate',
    addQuestion: 'Add Blank Question',
    launchSession: 'Launch Session ->',
    editQuestion: 'Edit question',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    deleteQuestion: 'Delete',
    moveUp: 'Move up',
    moveDown: 'Move down',
    explanationLabel: 'Explanation',
    correctAnswer: 'Correct answer',
    optionLabel: 'Option',
    presenterView: 'Presenter View',
    lobby: 'Lobby',
    startQuiz: 'Start Quiz ->',
    nextQuestion: 'Next ->',
    revealAnswer: 'Reveal Answer',
    showLeaderboard: 'Leaderboard',
    finishQuiz: 'Finish Quiz',
    backToBuilder: 'Back to Builder',
    participants: 'Participants',
    joinLink: 'Join link',
    sessionCode: 'Session code',
    answerTiles: 'Answer tiles',
    questionLabel: 'Question',
    noQuizGenerated: 'Generate a quiz first to edit or launch it.',
    hostReady: 'Host controls are ready.',
    localSessionNote: 'This session runs locally in the current app as a presenter scaffold.',
    testOllama: 'Test Ollama Connection',
    testingOllama: 'Testing Ollama...',
    ollamaReachable: 'Ollama is reachable.',
    ollamaModelMissing: 'Ollama is reachable, but the configured model is not installed.',
    ollamaSettings: 'Ollama settings',
    ollamaBaseUrl: 'Ollama base URL',
    ollamaModel: 'Ollama model',
    ollamaApiKey: 'Ollama API key',
    saveOllamaSettings: 'Save Ollama Settings',
    ollamaSettingsSaved: 'Ollama settings saved in this browser.',
    hostedOllamaHint: 'For GitHub Pages or any hosted frontend, set the actual remote Ollama URL here. Build-time localhost will not be correct for other users.',
  },
  de: {
    appName: 'LexiView',
    dashboard: 'Startseite',
    reader: 'Leser',
    wordBank: 'Wortbank',
    quizBuilder: 'Quiz-Builder',
    logout: 'Abmelden',
    user: 'Benutzer',
    signInTitle: 'Willkommen bei LexiView',
    signInBody: 'Erstelle ein lokales Profil, um Worte und Lesestufe auf diesem Gerat zu speichern.',
    usernamePlaceholder: 'Benutzernamen wahlen',
    continueButton: 'Weiter',
    dashboardTitle: 'Schneller lesen, besser behalten',
    dashboardSubtitle: 'Tippe Worte in PDFs an, hore Aussprache, sieh einfache Bedeutungen und baue deine Wortbank.',
    openReader: 'Leser offnen',
    openWordBank: 'Wortbank offnen',
    openQuizBuilder: 'Quiz-Builder offnen',
    slideReaderTitle: 'Leser',
    slideReaderBody: 'Lade ein PDF hoch und doppelklicke ein Wort fur sofortige Suche.',
    slideDictionaryTitle: 'Kluges Worterbuch',
    slideDictionaryBody: 'Fokus auf Englisch, Deutsch und Franzosisch mit Aussprache und Kurzdefinition.',
    slideRetentionTitle: 'Wortbank',
    slideRetentionBody: 'Speichere Worte und steigere deine Lesestufe mit der Zeit.',
    settings: 'Einstellungen',
    collapseSettings: 'Einstellungen ausblenden',
    expandSettings: 'Einstellungen anzeigen',
    fontSize: 'Schriftgrosse',
    lineHeight: 'Zeilenhohe',
    letterSpacing: 'Zeichenabstand',
    font: 'Schrift',
    language: 'Sprache',
    theme: 'Design',
    light: 'Hell',
    dark: 'Dunkel',
    pdfZoom: 'PDF-Zoom',
    textOpacity: 'Text-Deckkraft',
    clearPdf: 'PDF leeren',
    dropPdf: 'PDF hier ablegen',
    clickToBrowse: 'oder klicken zum Auswahlen',
    restoringPdf: 'Letztes PDF wird geladen...',
    parsingPdf: 'PDF wird analysiert...',
    lookupHint: 'Doppelklick oder Wort markieren fur Suche',
    savedWords: 'Gespeicherte Worte',
    remove: 'Entfernen',
    saveWord: 'Wort speichern',
    noEntryFound: 'Kein Eintrag gefunden.',
    lookingUp: 'Suche nach',
    pronunciation: 'Aussprache',
    playAudio: 'Audio abspielen',
    quickMeaning: 'Kurzbedeutung',
    imageForWord: 'Bild',
    etymology: 'Etymologie',
    levelBeginner: 'Anfanger',
    levelIntermediate: 'Mittelstufe',
    levelAdvanced: 'Fortgeschritten',
    readerEmptyTitle: 'Offne den Leser zum Starten',
    readerEmptyBody: 'Nutze das obere Menu und wahle Leser.',
    wordBankEmpty: 'Noch keine gespeicherten Worte.',
    practice: 'Uben',
    test: 'Test',
    setsBySource: 'Sets nach Quelle',
    tapToFlip: 'Karte antippen zum Umdrehen',
    wordType: 'Wortart',
    primaryDefinitions: 'Primare Definitionen',
    testInstruction: 'Tippe das Wort passend zum Hinweis.',
    yourAnswer: 'Deine Antwort',
    check: 'Prufen',
    correct: 'Richtig',
    tryAgain: 'Nochmal',
    reveal: 'Auflosen',
    generalSet: 'Allgemeines Set',
    quizBuilderTitle: 'KI Quiz Generator',
    quizBuilderSubtitle: 'Lege Sprache, Niveau, Thema und Zeit fest, bevor du dein Klassenquiz erzeugst.',
    generatorOptions: 'Generator Optionen',
    quizLanguage: 'Sprache',
    cefrLevel: 'CEFR Niveau',
    topic: 'Thema',
    topicPlaceholder: 'Cafe Wortschatz, Konjunktiv, Klimadebatte...',
    quizType: 'Quiztyp',
    numberOfQuestions: 'Anzahl Fragen',
    optionsPerQuestion: 'Optionen pro Frage',
    timePerQuestion: 'Zeit pro Frage',
    titleOptional: 'Titel (optional)',
    titlePlaceholder: 'Leer lassen fur automatische Erzeugung',
    generateQuiz: 'Quiz erzeugen ->',
    vocabulary: 'Wortschatz',
    grammar: 'Grammatik',
    comprehension: 'Verstandnis',
    translation: 'Ubersetzung',
    fillInTheBlank: 'Luckentext',
    errorDetection: 'Fehler finden',
    generatedQuiz: 'Erzeugtes Quiz',
    regenerateAll: 'Alles neu erzeugen',
    regenerate: 'Neu erzeugen',
    addQuestion: 'Leere Frage',
    launchSession: 'Session starten ->',
    editQuestion: 'Frage bearbeiten',
    saveChanges: 'Speichern',
    cancel: 'Abbrechen',
    deleteQuestion: 'Loschen',
    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    explanationLabel: 'Erklarung',
    correctAnswer: 'Richtige Antwort',
    optionLabel: 'Option',
    presenterView: 'Presenter Ansicht',
    lobby: 'Lobby',
    startQuiz: 'Quiz starten ->',
    nextQuestion: 'Weiter ->',
    revealAnswer: 'Antwort zeigen',
    showLeaderboard: 'Bestenliste',
    finishQuiz: 'Quiz beenden',
    backToBuilder: 'Zuruck zum Builder',
    participants: 'Teilnehmer',
    joinLink: 'Join Link',
    sessionCode: 'Session Code',
    answerTiles: 'Antwortfelder',
    questionLabel: 'Frage',
    noQuizGenerated: 'Erzeuge zuerst ein Quiz, um es zu bearbeiten oder zu starten.',
    hostReady: 'Host Steuerung ist bereit.',
    localSessionNote: 'Diese Session lauft lokal in der aktuellen App als Presenter Gerust.',
    testOllama: 'Ollama Verbindung testen',
    testingOllama: 'Ollama wird getestet...',
    ollamaReachable: 'Ollama ist erreichbar.',
    ollamaModelMissing: 'Ollama ist erreichbar, aber das konfigurierte Modell ist nicht installiert.',
    ollamaSettings: 'Ollama Einstellungen',
    ollamaBaseUrl: 'Ollama Basis URL',
    ollamaModel: 'Ollama Modell',
    ollamaApiKey: 'Ollama API Schlussel',
    saveOllamaSettings: 'Ollama Einstellungen speichern',
    ollamaSettingsSaved: 'Ollama Einstellungen wurden in diesem Browser gespeichert.',
    hostedOllamaHint: 'Fur GitHub Pages oder andere gehostete Frontends trage hier die echte entfernte Ollama URL ein. Das Build-zeit localhost ist fur andere Nutzer falsch.',
  },
  fr: {
    appName: 'LexiView',
    dashboard: 'Tableau de bord',
    reader: 'Lecteur',
    wordBank: 'Banque de mots',
    quizBuilder: 'Generateur',
    logout: 'Se deconnecter',
    user: 'Utilisateur',
    signInTitle: 'Bienvenue dans LexiView',
    signInBody: 'Creez un profil local pour sauvegarder vos mots et votre niveau de lecture sur cet appareil.',
    usernamePlaceholder: 'Choisissez un nom',
    continueButton: 'Continuer',
    dashboardTitle: 'Lisez plus vite, retenez mieux',
    dashboardSubtitle: 'Touchez des mots dans vos PDF, ecoutez la prononciation, voyez des definitions simples, et construisez votre banque.',
    openReader: 'Ouvrir le lecteur',
    openWordBank: 'Ouvrir la banque',
    openQuizBuilder: 'Ouvrir le generateur',
    slideReaderTitle: 'Lecteur',
    slideReaderBody: 'Importez un PDF et double-cliquez sur un mot pour une recherche immediate.',
    slideDictionaryTitle: 'Dictionnaire intelligent',
    slideDictionaryBody: 'Concentre sur anglais, allemand et francais avec prononciation et sens rapide.',
    slideRetentionTitle: 'Banque de mots',
    slideRetentionBody: 'Sauvegardez des mots et augmentez votre niveau de lecture.',
    settings: 'Parametres',
    collapseSettings: 'Masquer les parametres',
    expandSettings: 'Afficher les parametres',
    fontSize: 'Taille de police',
    lineHeight: 'Hauteur de ligne',
    letterSpacing: 'Espacement des lettres',
    font: 'Police',
    language: 'Langue',
    theme: 'Theme',
    light: 'Clair',
    dark: 'Sombre',
    pdfZoom: 'Zoom PDF',
    textOpacity: 'Opacite du texte',
    clearPdf: 'Effacer le PDF',
    dropPdf: 'Deposez le PDF ici',
    clickToBrowse: 'ou cliquez pour parcourir',
    restoringPdf: 'Restauration du dernier PDF...',
    parsingPdf: 'Analyse du PDF...',
    lookupHint: 'Double-cliquez ou selectionnez un mot pour le rechercher',
    savedWords: 'Mots sauvegardes',
    remove: 'Retirer',
    saveWord: 'Sauvegarder le mot',
    noEntryFound: 'Aucune entree trouvee.',
    lookingUp: 'Recherche de',
    pronunciation: 'Prononciation',
    playAudio: 'Lire audio',
    quickMeaning: 'Sens rapide',
    imageForWord: 'Image',
    etymology: 'Etymologie',
    levelBeginner: 'Debutant',
    levelIntermediate: 'Intermediaire',
    levelAdvanced: 'Avance',
    readerEmptyTitle: 'Ouvrez le lecteur pour commencer',
    readerEmptyBody: 'Utilisez le menu du haut et choisissez Lecteur.',
    wordBankEmpty: 'Aucun mot sauvegarde pour le moment.',
    practice: 'Pratique',
    test: 'Test',
    setsBySource: 'Ensembles par source',
    tapToFlip: 'Touchez la carte pour retourner',
    wordType: 'Type de mot',
    primaryDefinitions: 'Definitions principales',
    testInstruction: 'Tapez le mot qui correspond a l indice.',
    yourAnswer: 'Votre reponse',
    check: 'Verifier',
    correct: 'Correct',
    tryAgain: 'Reessayer',
    reveal: 'Afficher',
    generalSet: 'Ensemble general',
    quizBuilderTitle: 'Generateur de quiz IA',
    quizBuilderSubtitle: 'Definissez langue, niveau, sujet et minuterie avant de generer votre quiz de classe.',
    generatorOptions: 'Options du generateur',
    quizLanguage: 'Langue',
    cefrLevel: 'Niveau CECR',
    topic: 'Sujet',
    topicPlaceholder: 'Vocabulaire du cafe, subjonctif, debat climat...',
    quizType: 'Type de quiz',
    numberOfQuestions: 'Nombre de questions',
    optionsPerQuestion: 'Options par question',
    timePerQuestion: 'Temps par question',
    titleOptional: 'Titre (optionnel)',
    titlePlaceholder: 'Laissez vide pour generation auto',
    generateQuiz: 'Generer le quiz ->',
    vocabulary: 'Vocabulaire',
    grammar: 'Grammaire',
    comprehension: 'Comprehension',
    translation: 'Traduction',
    fillInTheBlank: 'Texte a trou',
    errorDetection: 'Detection d erreur',
    generatedQuiz: 'Quiz genere',
    regenerateAll: 'Tout regenerer',
    regenerate: 'Regenerer',
    addQuestion: 'Ajouter une question vide',
    launchSession: 'Lancer la session ->',
    editQuestion: 'Modifier la question',
    saveChanges: 'Enregistrer',
    cancel: 'Annuler',
    deleteQuestion: 'Supprimer',
    moveUp: 'Monter',
    moveDown: 'Descendre',
    explanationLabel: 'Explication',
    correctAnswer: 'Bonne reponse',
    optionLabel: 'Option',
    presenterView: 'Vue presentateur',
    lobby: 'Salon',
    startQuiz: 'Demarrer le quiz ->',
    nextQuestion: 'Suivant ->',
    revealAnswer: 'Afficher la reponse',
    showLeaderboard: 'Classement',
    finishQuiz: 'Terminer le quiz',
    backToBuilder: 'Retour au generateur',
    participants: 'Participants',
    joinLink: 'Lien',
    sessionCode: 'Code session',
    answerTiles: 'Tuiles de reponse',
    questionLabel: 'Question',
    noQuizGenerated: 'Generez d abord un quiz pour le modifier ou le lancer.',
    hostReady: 'Les controles hote sont prets.',
    localSessionNote: 'Cette session fonctionne localement dans l application comme squelette presentateur.',
    testOllama: 'Tester la connexion Ollama',
    testingOllama: 'Test Ollama en cours...',
    ollamaReachable: 'Ollama est joignable.',
    ollamaModelMissing: 'Ollama est joignable, mais le modele configure n est pas installe.',
    ollamaSettings: 'Parametres Ollama',
    ollamaBaseUrl: 'URL Ollama',
    ollamaModel: 'Modele Ollama',
    ollamaApiKey: 'Cle API Ollama',
    saveOllamaSettings: 'Enregistrer les parametres Ollama',
    ollamaSettingsSaved: 'Les parametres Ollama sont enregistres dans ce navigateur.',
    hostedOllamaHint: 'Pour GitHub Pages ou tout frontend heberge, renseignez ici la vraie URL Ollama distante. Le localhost du build n est pas correct pour les autres utilisateurs.',
  },
}

export function normalizeUiLanguage(value: 'en' | 'de' | 'fr' | 'auto'): UiLanguage {
  if (value === 'auto') {
    const browserLang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en'
    if (browserLang.startsWith('de')) return 'de'
    if (browserLang.startsWith('fr')) return 'fr'
    return 'en'
  }
  return value
}

export function getUiCopy(value: 'en' | 'de' | 'fr' | 'auto') {
  const lang = normalizeUiLanguage(value)
  return COPY[lang]
}

export function levelLabel(level: 'beginner' | 'intermediate' | 'advanced', lang: 'en' | 'de' | 'fr' | 'auto') {
  const copy = getUiCopy(lang)
  if (level === 'beginner') return copy.levelBeginner
  if (level === 'intermediate') return copy.levelIntermediate
  return copy.levelAdvanced
}

export function viewLabel(view: AppView, lang: 'en' | 'de' | 'fr' | 'auto') {
  const copy = getUiCopy(lang)
  if (view === 'dashboard') return copy.dashboard
  if (view === 'reader') return copy.reader
  if (view === 'wordbank') return copy.wordBank
  return copy.quizBuilder
}
