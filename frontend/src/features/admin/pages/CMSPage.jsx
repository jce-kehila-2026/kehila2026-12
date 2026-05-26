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
import PreviewIcon from '@mui/icons-material/Preview';
import PublicHomePageHomeTab from './PublicHomePageHomeTab';
import PublicHomePageLearnTogetherTab from './PublicHomePageLearnTogetherTab';
import PublicHomePageInspirationStoriesTab from './PublicHomePageInspirationStoriesTab';
import PublicHomePagePressCoverageTab from './PublicHomePagePressCoverageTab';
import PublicHomePageTeamTab from './PublicHomePageTeamTab';
import PartnersManagementPage from './PartnersManagementPage';

const TABS = [
  { key: 'home', label: 'Home', icon: <HomeIcon />, Component: PublicHomePageHomeTab },
  { key: 'aboutUs', label: 'About Us', icon: <InfoIcon />, Component: PublicHomePageLearnTogetherTab },
  {
    key: 'inspirationStories',
    label: 'Inspirational Stories',
    icon: <AutoStoriesIcon />,
    Component: PublicHomePageInspirationStoriesTab,
  },
  {
    key: 'pressCoverage',
    label: 'Press Coverage',
    icon: <NewspaperIcon />,
    Component: PublicHomePagePressCoverageTab,
  },
  {
    key: 'team',
    label: 'Team',
    icon: <GroupsIcon />,
    Component: PublicHomePageTeamTab,
  },
  {
    key: 'partners',
    label: 'Partners',
    icon: <HandshakeIcon />,
    Component: PartnersManagementPage,
  },
];

export default function CMSPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ pb: 12 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4">Public Home-page</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            Edit the public home page content. Changes are visible to all visitors after save.
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
          Preview Home-page
        </Button>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.key} label={tab.label} icon={tab.icon} iconPosition="start" />
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
