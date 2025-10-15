
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AttendanceRecord } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ProjectAttendanceHistory({ attendanceRecords }: { attendanceRecords: AttendanceRecord[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attendanceRecords, searchTerm]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Riwayat Absensi (Periode Ini)</CardTitle>
        <CardDescription>Menampilkan data absensi yang telah diinput untuk periode berjalan.</CardDescription>
        <Input 
          placeholder="Cari nama karyawan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Kehadiran</TableHead>
                <TableHead>Lembur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => {
                  const totalAttendance = Object.values(record.attendanceByPosition || {}).reduce((sum, days) => sum + (days || 0), 0);
                  const totalOvertime = Object.values(record.overtimeByPosition || {}).reduce((sum, hours) => sum + (hours || 0), 0);

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell><Badge variant="secondary">{totalAttendance} hari</Badge></TableCell>
                      <TableCell><Badge variant="outline">{totalOvertime} jam</Badge></TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Tidak ada riwayat absensi untuk ditampilkan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
