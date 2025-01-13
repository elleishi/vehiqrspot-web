import React, { useState, useEffect } from 'react';
import { FaCar, FaUser, FaFlag } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import '../src/style/Overview.css';

// Firebase
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './../firebaseConfig';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Home = () => {
  const [userCount, setUserCount] = useState(0);
  const [totalViolationsCount, setTotalViolationsCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [vehicleType, setVehicleType] = useState({ car: 0, motorcycle: 0, ebike: 0, tricycle: 0 });
  const [barChartData, setBarChartData] = useState({Student: 0, Staff: 0, Faculty: 0});

  const fetchData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'user'));

      const registeredUserCount = usersSnapshot.docs.length;

      const vehicleTypeCounts = { car: 0, motorcycle: 0, ebike: 0, tricycle: 0 };
      const userCategories = { Student: 0, Faculty: 0, Staff: 0};

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const type = data.vehicle?.vehicleType?.toLowerCase() || 'unknown';
        const role = data.role?.charAt(0).toUpperCase() + data.role?.slice(1).toLowerCase() || 'Unknown';

        if (vehicleTypeCounts[type] !== undefined) {
          vehicleTypeCounts[type] += 1;
        }

        // Count user roles
        if (userCategories[role] !== undefined) {
          userCategories[role] += 1;
        }
      });

      const totalVehicles = Object.values(vehicleTypeCounts).reduce((sum, count) => sum + count, 0);
      const barData = Object.entries(userCategories).map(([key, value]) => ({
        name: key,
        count: value,
      }));

      // Update state
      setUserCount(registeredUserCount);
      setVehicleType(vehicleTypeCounts);
      setVehicleCount(totalVehicles);
      setBarChartData(barData);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

    // all violations
    const fetchTotalViolations = () => {
      const unsubscribe = onSnapshot(collection(db, 'violations'), (snapshot) => {
        setTotalViolationsCount(snapshot.size); // Total number of violations
      });
      return unsubscribe;
    };
    
    useEffect(() => {
      const unsubscribe = fetchTotalViolations();
      return () => unsubscribe();
    }, []);
  



  const doughnutData = {
    labels: ['Car', 'Motorcycle', 'E-bike', 'Tricycle'],
    datasets: [
      {
        label: 'Vehicle Data',
        data: [vehicleType.car, vehicleType.motorcycle, vehicleType.ebike, vehicleType.tricycle],
        backgroundColor: ['#9ab685', '#314026', '#66894c', '#4a7036'],
        hoverBackgroundColor: ['#ACBF9E'],
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
  };
  

  return (
    <main className="main-container">
      <div className="main-cards">
        <div className="fcard">
          <div className="s-inner">
            <h1>{userCount}</h1>
            <h4>Total of registered users</h4>
            <div className="icon-circle">
              <FaUser className="card_icon" />
            </div>
          </div>
        </div>
        <div className="fcard">
          <div className="s-inner">
            <h1>{totalViolationsCount}</h1>
            <h4>Total of Violators</h4>
            <div className="icon-circle">
              <FaFlag className="card_icon" />
            </div>
          </div>
        </div>
        <div className="fcard">
          <div className="s-inner">
            <h1>{vehicleCount}</h1>
            <h4>Total of vehicle</h4>
            <div className="icon-circle">
              <FaCar className="card_icon" />
            </div>
          </div>
        </div>
      </div>

      <div className="charts">
        {/* Doughnut Chart */}
        <div className="d-card">
          <h3 className="d-label">Types of Vehicle</h3>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>

        {/* Bar Chart */}
        <div className="b-card">
          <h3 className="b-label">Registered Users</h3>
          <ResponsiveContainer width="80%" height={200}>
          <BarChart
              data={barChartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} vertical={false} />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 14 }} 
              />
              <YAxis 
                tickFormatter={(value) => value} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10}}  
              />
              <Tooltip itemStyle={{ fontSize: '10px' }} /> 
              <Bar dataKey="count" fill="#66894c" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
};

export default Home;
