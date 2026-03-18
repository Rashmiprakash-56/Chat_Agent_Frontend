import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          p: 4,
          maxWidth: 420,
          backgroundColor: '#ffffff',
          borderRadius: 2,
          boxShadow: '0px 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <Typography
          variant="h2"
          fontWeight={700}
          color="primary"
          gutterBottom
        >
          404
        </Typography>

        <Typography variant="h6" fontWeight={600} gutterBottom>
          Page Not Found
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Link to={'/'}>
            <Button
            variant="contained"
            size="large"
            >
            Go to Dashboard
            </Button>
        </Link>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
