import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getWeekDays, getDayName } from '../../utils/dateUtils';

export default function ProgressChart({ tasks }) {
  const theme = useTheme();

  const data = useMemo(() => {
    const days = getWeekDays();
    return days.map((day) => {
      const count = tasks.filter(
        (t) => t.done && t.completedAt && t.completedAt.substring(0, 10) === day
      ).length;
      return { day: getDayName(day), count };
    });
  }, [tasks]);

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card sx={{ p: 0, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          📈 Progression (7 jours)
        </Typography>
        {!hasData ? (
          <Box
            sx={{
              height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'text.secondary', fontStyle: 'italic',
            }}
          >
            Complète des tâches pour voir ta progression !
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.mode === 'dark' ? '#1A1A2E' : '#FFFFFF',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
                labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                formatter={(value) => [`${value} tâche${value > 1 ? 's' : ''}`, 'Complétées']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#7C3AED"
                strokeWidth={3}
                fill="url(#colorGrad)"
                dot={{ fill: '#7C3AED', stroke: '#FFFFFF', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#A78BFA', stroke: '#7C3AED', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
