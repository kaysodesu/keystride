/* Static content: practice passages, word lists and the step-by-step course. */
window.KS_DATA = (function () {
  const PASSAGES = [
    { id: 'p1', level: 'Easy', title: 'Morning walk',
      text: 'The sun came up over the hill and the air was cool. A dog ran past the old red barn and a bird sang from the top of a tall tree. It was a good day to take a long walk.' },
    { id: 'p2', level: 'Easy', title: 'The garden',
      text: 'She planted beans, peas and small yellow flowers along the fence. Every evening she gave them water and pulled out the weeds. By the end of summer the garden was full of color.' },
    { id: 'p3', level: 'Medium', title: 'Learning to type',
      text: 'Typing well is less about speed and more about rhythm. Keep your fingers resting on the home row, look at the screen instead of the keys, and let each finger do its own job. Speed will follow accuracy.' },
    { id: 'p4', level: 'Medium', title: 'The night market',
      text: 'Lanterns swung above the narrow street as vendors called out their prices. The smell of grilled corn, fresh bread and sweet tea drifted through the crowd, and music played somewhere just out of sight.' },
    { id: 'p5', level: 'Medium', title: 'Small habits',
      text: 'Big changes rarely happen overnight. They are built from small habits repeated every day: ten minutes of practice, one more page read, a short walk after lunch. Over a year, those minutes add up to something remarkable.' },
    { id: 'p6', level: 'Hard', title: 'The workshop',
      text: "In the corner of Maya's workshop sat 14 jars of screws, 3 old radios, and a half-finished robot named Bolt. \"He'll walk by Friday,\" she said (though she'd said that every week since March)." },
    { id: 'p7', level: 'Hard', title: 'Quarterly notes',
      text: 'Revenue grew 12.5% to $48,300 in Q3, while costs fell from $21,950 to $19,400. The team shipped 7 releases, closed 236 tickets, and reduced average response time to 2.4 hours. Next goal: 99.9% uptime!' },
    { id: 'p8', level: 'Hard', title: 'Deep sea',
      text: 'Far below the waves, where sunlight never reaches, strange creatures glow in the dark. Some carry tiny lights to attract prey; others flash patterns to signal one another. Scientists estimate that most of the ocean remains unexplored.' },
  ];

  const COMMON_WORDS = ('the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is was are been has had were said each tell does set three air play small end put home read hand port large spell add land here must big high such follow act why ask men change went light kind off need house picture try again animal point mother world near build self earth father head stand own page should country found answer school grow study still learn plant cover food sun four between state keep eye never last let thought city tree cross farm hard start might story saw far sea draw left late run while press close night real life few north open seem together next white children begin got walk example ease paper group always music those both mark often letter until mile river car feet care second book carry took science eat room friend began idea fish mountain stop once base hear horse cut sure watch color face wood main enough plain girl usual young ready above ever red list though feel talk bird soon body dog family direct pose leave song measure door product black short numeral class wind question happen complete ship area half rock order fire south problem piece told knew pass since top whole king space heard best hour better true during hundred five remember step early hold west ground interest reach fast verb sing listen six table travel less morning ten simple several vowel toward war lay against pattern slow center love person money serve appear road map rain rule govern pull cold notice voice unit power town fine certain fly fall lead cry dark machine note wait plan figure star box noun field rest correct able pound done beauty drive stood contain front teach week final gave green oh quick develop ocean warm free minute strong special mind behind clear tail produce fact street inch multiply nothing course stay wheel full force blue object decide surface deep moon island foot system busy test record boat common gold possible plane stead dry wonder laugh thousand ago ran check game shape equate miss brought heat snow tire bring yes distant fill east paint language among').split(' ');

  // Course: each lesson has illustrated steps, then a drill typed with the guide keyboard.
  // step.keys  = keys highlighted in the diagram
  // step.demo  = characters the transparent hands act out, one after another
  const LESSONS = [
    {
      id: 'l1', title: 'Posture & the home row', blurb: 'Where your hands live.',
      steps: [
        { title: 'Sit up and relax', text: 'Sit with your feet flat, back straight and screen at eye level. Keep your wrists slightly raised so they float above the desk — never rest them on the keyboard while typing. Elbows should be bent at roughly a right angle.', keys: [] },
        { title: 'Find the bumps on F and J', text: 'Feel the small raised bumps on the <kbd>F</kbd> and <kbd>J</kbd> keys. Your left and right index fingers rest here. Whenever you get lost, find the bumps without looking.', keys: ['f', 'j'], demo: ['f', 'j'] },
        { title: 'Rest all eight fingers', text: 'Left hand: pinky on <kbd>A</kbd>, ring on <kbd>S</kbd>, middle on <kbd>D</kbd>, index on <kbd>F</kbd>. Right hand: index on <kbd>J</kbd>, middle on <kbd>K</kbd>, ring on <kbd>L</kbd>, pinky on <kbd>;</kbd>. This is the <b>home row</b>.', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], demo: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'] },
        { title: 'Thumbs on the space bar', text: 'Let your thumbs hover over the space bar. Tap it with whichever thumb feels natural — most people use the right one. Each finger presses its key and then returns home.', keys: ['Space'], demo: [' ', ' '] },
        { title: 'Colors show which finger', text: 'Throughout the course, each key is tinted with the color of the finger that presses it. When you practice, the next key lights up and the transparent hand shows the finger reaching for it.', keys: [], zonesLegend: true },
      ],
      drill: 'asdf jkl; asdf jkl; fdsa ;lkj ff jj dd kk ss ll aa ;; fj dk sl a; fj dk sl a;',
    },
    {
      id: 'l2', title: 'Home row words', blurb: 'Real words without leaving home.',
      steps: [
        { title: 'Words from eight keys', text: 'You can already type real words! Keep every finger on its home key and only move the one finger that is needed.', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l'], demo: ['f', 'a', 'l', 'l'] },
        { title: 'Press, then return', text: 'Tap each key lightly with the pad of your finger, then let it spring back to its home position. Try typing <b>dad</b>, <b>sad</b> and <b>ask</b> — watch which fingers move.', keys: ['d', 'a', 's', 'k'], demo: ['a', 's', 'k'] },
      ],
      drill: 'sad dad lad fad all fall add ask asks flask salad lass alas dads falls a sad lad asks dad',
    },
    {
      id: 'l3', title: 'G and H', blurb: 'Index fingers stretch inward.',
      steps: [
        { title: 'Left index reaches to G', text: 'Slide your left index finger one key to the right, from <kbd>F</kbd> to <kbd>G</kbd>. The other fingers stay anchored.', keys: ['g'], demo: ['f', 'g', 'f', 'g'] },
        { title: 'Right index reaches to H', text: 'Slide your right index finger one key to the left, from <kbd>J</kbd> to <kbd>H</kbd>. Then return to J.', keys: ['h'], demo: ['j', 'h', 'j', 'h'] },
      ],
      drill: 'fgf jhj gag had has gash half hall glad flash shall dash hash lag gal flag a glad dad has a flag',
    },
    {
      id: 'l4', title: 'Top row — left hand', blurb: 'Q W E R T',
      steps: [
        { title: 'Middle finger up to E', text: 'Reach your left middle finger up and slightly left from <kbd>D</kbd> to <kbd>E</kbd>. E is the most common letter in English, so this reach matters!', keys: ['e'], demo: ['d', 'e', 'd', 'e'] },
        { title: 'Index finger covers R and T', text: 'Your left index finger reaches up from <kbd>F</kbd> to <kbd>R</kbd>, and up-and-right to <kbd>T</kbd>.', keys: ['r', 't'], demo: ['r', 'f', 't', 'f'] },
        { title: 'Ring to W, pinky to Q', text: 'The ring finger reaches from <kbd>S</kbd> to <kbd>W</kbd> and the pinky from <kbd>A</kbd> to <kbd>Q</kbd>.', keys: ['w', 'q'], demo: ['w', 's', 'q', 'a'] },
      ],
      drill: 'ded frf ftf sws aqa tree were dart free tear stew wade great fresh steer request water a great tree was there',
    },
    {
      id: 'l5', title: 'Top row — right hand', blurb: 'Y U I O P',
      steps: [
        { title: 'Index finger covers U and Y', text: 'Your right index finger reaches up from <kbd>J</kbd> to <kbd>U</kbd>, and up-and-left to <kbd>Y</kbd>.', keys: ['u', 'y'], demo: ['u', 'j', 'y', 'j'] },
        { title: 'Middle to I, ring to O', text: 'The middle finger reaches from <kbd>K</kbd> to <kbd>I</kbd> and the ring finger from <kbd>L</kbd> to <kbd>O</kbd>.', keys: ['i', 'o'], demo: ['i', 'k', 'o', 'l'] },
        { title: 'Pinky to P', text: 'The right pinky reaches from <kbd>;</kbd> up to <kbd>P</kbd>.', keys: ['p'], demo: ['p', ';', 'p'] },
      ],
      drill: 'juj jyj kik lol ;p; you your pour hoop july quilt joy pipe youth equip yes it is your turn to type',
    },
    {
      id: 'l6', title: 'Bottom row', blurb: 'Z X C V B N M , . /',
      steps: [
        { title: 'Curl down to the bottom row', text: 'Bottom-row keys are reached by curling your fingers down and slightly right. Left hand: pinky <kbd>Z</kbd>, ring <kbd>X</kbd>, middle <kbd>C</kbd>, index <kbd>V</kbd> and <kbd>B</kbd>.', keys: ['z', 'x', 'c', 'v', 'b'], demo: ['z', 'x', 'c', 'v', 'b'] },
        { title: 'Right hand bottom row', text: 'Right hand: index <kbd>N</kbd> and <kbd>M</kbd>, middle <kbd>,</kbd>, ring <kbd>.</kbd>, pinky <kbd>/</kbd>.', keys: ['n', 'm', ',', '.', '/'], demo: ['n', 'm', ',', '.', '/'] },
      ],
      drill: 'aza sxs dcd fvf fbf jnj jmj k,k l.l ;/; vex buzz calm zinc mix next bomb, van. cab, box, can. zebras move north.',
    },
    {
      id: 'l7', title: 'Shift & capitals', blurb: 'Use the opposite hand.',
      steps: [
        { title: 'Opposite hand holds Shift', text: 'To type a capital letter, hold <kbd>Shift</kbd> with the pinky of the <b>other</b> hand. For a capital <b>A</b> (left hand), hold the right Shift.', keys: ['ShiftR', 'a'], demo: ['A'] },
        { title: 'Right-hand capitals', text: 'For a capital <b>J</b> (right hand), hold the left Shift with your left pinky, then press J.', keys: ['ShiftL', 'j'], demo: ['J'] },
        { title: 'Punctuation uses Shift too', text: 'Symbols on the top half of a key — like <kbd>:</kbd> <kbd>"</kbd> <kbd>?</kbd> — need Shift as well. A question mark is Shift + <kbd>/</kbd>.', keys: ['ShiftL', '/'], demo: ['?', '"'] },
      ],
      drill: 'Alice and Bob met Dana. Jake asked Kate, "Is it Lima or Oslo?" Hello, World. Yes! Go Team.',
    },
    {
      id: 'l8', title: 'Numbers & symbols', blurb: 'The top of the keyboard.',
      steps: [
        { title: 'Numbers are reached from the top row', text: 'Each finger reaches two rows up from home. Left: pinky <kbd>1</kbd>, ring <kbd>2</kbd>, middle <kbd>3</kbd>, index <kbd>4</kbd> <kbd>5</kbd>.', keys: ['1', '2', '3', '4', '5'], demo: ['1', '2', '3', '4', '5'] },
        { title: 'Right-hand numbers', text: 'Right: index <kbd>6</kbd> <kbd>7</kbd>, middle <kbd>8</kbd>, ring <kbd>9</kbd>, pinky <kbd>0</kbd>.', keys: ['6', '7', '8', '9', '0'], demo: ['6', '7', '8', '9', '0'] },
        { title: 'Common symbols', text: '<kbd>$</kbd> is Shift + 4, <kbd>%</kbd> is Shift + 5 and <kbd>:</kbd> is Shift + ;. Take it slowly — accuracy first.', keys: ['4', '5'], demo: ['$', '%', ':'] },
      ],
      drill: '12 34 56 78 90 10 20 30 2026 10:45 $19.99 50% 3 cats and 7 dogs; call 555 0142 at 9:30.',
    },
    {
      id: 'l9', title: 'Putting it together', blurb: 'Full sentences with rhythm.',
      steps: [
        { title: 'Eyes on the screen', text: 'Try not to look at your hands. Glance at the guide keyboard on screen instead — it shows you exactly which finger to use.', keys: [] },
        { title: 'Steady rhythm beats bursts', text: 'Type at an even pace, like a metronome. Slow down on tricky words rather than rushing and making mistakes. Speed grows naturally once your accuracy is above 95%.', keys: [], demo: ['t', 'h', 'e', ' '] },
      ],
      drill: 'Practice a little every day. Keep your eyes on the screen, trust your fingers, and the speed will come.',
    },
  ];

  return { PASSAGES, COMMON_WORDS, LESSONS };
})();
