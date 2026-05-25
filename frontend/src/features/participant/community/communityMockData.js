import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';

export const communityPosts = [
  {
    author: 'Maya',
    initials: 'MA',
    time: 'Today at 9:20',
    topic: 'Support circle',
    title: 'A gentle reminder for this morning',
    body: 'I started the day with five quiet minutes and it helped me feel more present. Sending care to anyone who needs a softer start today.',
    likes: 28,
    comments: 7,
    support: 12,
    tone: 'pink',
    previewComments: [
      { author: 'Rina', initials: 'RI', time: '1h', text: 'Thank you for sharing this. I needed that reminder today.' },
      { author: 'Dana', initials: 'DA', time: '45m', text: 'Five quiet minutes sounds like something I can try too.' },
    ],
  },
  {
    author: 'Anonymous Participant',
    initials: 'AP',
    time: 'Today at 8:10',
    topic: 'Quiet courage',
    title: 'Sharing a small brave step',
    body: 'I was nervous to join a group session, but listening quietly still helped me feel less alone. Taking part can look different for each of us.',
    likes: 22,
    comments: 4,
    support: 18,
    tone: 'lavender',
    previewComments: [
      { author: 'Maya', initials: 'MA', time: '30m', text: 'Listening quietly is still showing up. That matters.' },
      { author: 'Leah', initials: 'LE', time: '18m', text: 'I relate to this so much. Thank you for naming it.' },
    ],
  },
  {
    author: 'Leah',
    initials: 'LE',
    time: 'Yesterday',
    topic: 'After appointments',
    title: 'What helped me prepare',
    body: 'Writing down three questions before my appointment made the conversation feel calmer. I kept the note simple and brought it with me.',
    likes: 19,
    comments: 5,
    support: 8,
    tone: 'violet',
    previewComments: [
      { author: 'Noa', initials: 'NO', time: 'Yesterday', text: 'This is such a practical idea. I am going to write mine down tonight.' },
      { author: 'Shira', initials: 'SH', time: 'Yesterday', text: 'Simple notes make a big difference for me too.' },
    ],
  },
  {
    author: 'Noa',
    initials: 'NO',
    time: 'Monday',
    topic: 'Daily care',
    title: 'Small wins count',
    body: 'Today my win was asking for help before I felt overwhelmed. It felt vulnerable, but also really grounding.',
    likes: 34,
    comments: 9,
    support: 15,
    tone: 'rose',
    previewComments: [
      { author: 'Anonymous Participant', initials: 'AP', time: 'Mon', text: 'Asking early is hard. I am proud of you for doing that.' },
      { author: 'Rina', initials: 'RI', time: 'Mon', text: 'That is a real win.' },
    ],
  },
];

export const supportCircles = [
  { title: 'New Members Circle', meta: '12 members', icon: Diversity3OutlinedIcon },
  { title: 'Mindful Mornings', meta: 'Weekly reflection', icon: SelfImprovementOutlinedIcon },
  { title: 'Care Partners', meta: 'Shared encouragement', icon: VolunteerActivismOutlinedIcon },
];

export const birthdayMessages = [
  'Wishing you happiness and beautiful days ahead 💜',
  'Happy Birthday! Your journey inspires us 🌸',
  'Sending you love and warm wishes today 🎂',
];

export const communityBirthdayUsers = [
  { id: 'birthday-sara', name: 'Sara', birthday: '2000-05-21' },
  { id: 'birthday-rina', name: 'Rina', birthday: '1994-11-12' },
];

export const communityGuidelines = [
  'Be kind and respectful',
  'Share with honesty and empathy',
  'What’s shared here, stays here',
  'No judgment, just support',
];

export const modalGuidelines = [
  'Be kind and respectful',
  'Protect your privacy and the privacy of others',
  'Do not share harmful or offensive content',
  'What is shared here should stay within the community',
  'No judgment, only support',
];
