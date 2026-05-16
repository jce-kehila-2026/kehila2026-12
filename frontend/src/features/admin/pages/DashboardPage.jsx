import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAdmin } from '../context/AdminContext';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const STAT_CARDS = [
  { key: 'events', label: 'Total Events', icon: <EventIcon />, color: '#DF327B', bgColor: 'rgba(223,50,123,0.15)' },
  { key: 'users', label: 'Registered Users', icon: <PeopleIcon />, color: '#6B3F97', bgColor: 'rgba(107,63,151,0.15)' },
  { key: 'articles', label: 'Published Articles', icon: <ArticleIcon />, color: '#f5a623', bgColor: 'rgba(245,166,35,0.15)' },
  { key: 'logs', label: 'Audit Entries', icon: <ReceiptLongIcon />, color: '#38bdf8', bgColor: 'rgba(56,189,248,0.15)' },
];

export default function DashboardPage() {
  const { userRole, currentUser } = useAdmin();
  const [stats, setStats] = useState({ events: 0, users: 0, articles: 0, logs: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const counts = await Promise.all([
          getCountFromServer(query(collection(db, 'events'), where('status', '==', 'published'))).then((s) => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'users')).then((s) => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'articles')).then((s) => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'audit_logs')).then((s) => s.data().count).catch(() => 0),
        ]);
        setStats({ events: counts[0], users: counts[1], articles: counts[2], logs: counts[3] });

        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
        const snap = await getDocs(q);
        setRecentLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [userRole]);

  const visibleCards = STAT_CARDS;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4">
          Welcome back{currentUser?.email ? `, ${currentUser.email.split('@')[0]}` : ''} 👋
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Here's an overview of the She-Na platform.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {visibleCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.key}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 250ms ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${card.color}, ${card.color}88)`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, mb: 2 }}>
                  {card.icon}
                </Box>
                {loading ? (
                  <Skeleton variant="text" width={60} sx={{ fontSize: '1.8rem' }} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0, mb: 0.5 }}>
                    {stats[card.key]}
                  </Typography>
                )}
                <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 500 }}>
                  {card.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Chip label={log.actionType} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{log.adminEmail || log.adminId}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {log.targetId ? log.targetId.substring(0, 12) + '…' : '—'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
