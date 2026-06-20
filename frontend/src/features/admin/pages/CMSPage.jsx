import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import GroupsIcon from '@mui/icons-material/Groups';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PreviewIcon from '@mui/icons-material/Preview';
import PublicHomePageHomeTab from './PublicHomePageHomeTab';
import PublicHomePageLearnTogetherTab from './PublicHomePageLearnTogetherTab';
import PublicHomePageInspirationStoriesTab from './PublicHomePageInspirationStoriesTab';
import PublicHomePagePressCoverageTab from './PublicHomePagePressCoverageTab';
import PublicHomePageTeamTab from './PublicHomePageTeamTab';
import PartnersManagementPage from './PartnersManagementPage';
import PublicHomePageContactTab from './PublicHomePageContactTab';
import { useAdminLocale } from '../context/AdminLocaleContext';

const TABS = [
  { key: 'home', labelKey: 'cmsTabHome', icon: <HomeIcon />, Component: PublicHomePageHomeTab },
  { key: 'aboutUs', labelKey: 'cmsTabAboutUs', icon: <InfoIcon />, Component: PublicHomePageLearnTogetherTab },
  {
    key: 'inspirationStories',
    labelKey: 'cmsTabInspiration',
    icon: <AutoStoriesIcon />,
    Component: PublicHomePageInspirationStoriesTab,
  },
  {
    key: 'pressCoverage',
    labelKey: 'cmsTabPress',
    icon: <NewspaperIcon />,
    Component: PublicHomePagePressCoverageTab,
  },
  {
    key: 'team',
    labelKey: 'cmsTabTeam',
    icon: <GroupsIcon />,
    Component: PublicHomePageTeamTab,
  },
  {
    key: 'partners',
    labelKey: 'cmsTabPartners',
    icon: <HandshakeIcon />,
    Component: PartnersManagementPage,
  },
  {
    key: 'contact',
    labelKey: 'cmsTabContact',
    icon: <ContactMailIcon />,
    Component: PublicHomePageContactTab,
  },
];

export default function CMSPage() {
  const { t, direction } = useAdminLocale();
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ pb: 12 }} dir={direction}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: '1rem' }}>
        <Box>
          <Typography variant="h4">{t('cmsHomePageTitle')}</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            {t('cmsHomePageSubtitle')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          component="a"
          href="/public"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ flexShrink: 0 }}
        >
          {t('cmsPreviewHomePage')}
        </Button>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.key} label={t(tab.labelKey)} icon={tab.icon} iconPosition="start" />
        ))}
      </Tabs>

      {TABS.map((tab, index) => (
        <Box key={tab.key} hidden={tabIndex !== index} role="tabpanel">
          {tabIndex === index ? <tab.Component /> : null}
        </Box>
      ))}
    </Box>
  );
}
