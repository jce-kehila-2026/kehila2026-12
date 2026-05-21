import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import SchoolIcon from '@mui/icons-material/School';
import PreviewIcon from '@mui/icons-material/Preview';
import PublicHomePageHomeTab from './PublicHomePageHomeTab';
import PublicHomePageAboutUsTab from './PublicHomePageAboutUsTab';
import PublicHomePageLearnTogetherTab from './PublicHomePageLearnTogetherTab';

const TABS = [
  { key: 'home', label: 'Home', icon: <HomeIcon />, Component: PublicHomePageHomeTab },
  { key: 'aboutUs', label: 'About Us', icon: <InfoIcon />, Component: PublicHomePageAboutUsTab },
  { key: 'learnTogether', label: 'Learn Together', icon: <SchoolIcon />, Component: PublicHomePageLearnTogetherTab },
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
