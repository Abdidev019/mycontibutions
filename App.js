import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, Button, FlatList, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [name, setName] = useState('');
  const [payment, setPayment] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Load contributions from AsyncStorage when the app mounts
  useEffect(() => {
    const loadContributions = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@contributions');
        if (jsonValue != null) {
          setContributions(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.log('Error loading contributions:', e);
      }
    };
    loadContributions();
  }, []);

  // Save contributions to AsyncStorage whenever they change
  useEffect(() => {
    const saveContributions = async () => {
      try {
        const jsonValue = JSON.stringify(contributions);
        await AsyncStorage.setItem('@contributions', jsonValue);
      } catch (e) {
        console.log('Error saving contributions:', e);
      }
    };
    saveContributions();
  }, [contributions]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // Sort contributions in descending order by date (current to old)
  const sortedContributions = [...contributions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const addOrUpdateContribution = () => {
    if (name && payment) {
      const formattedDate = formatDate(date);
      if (editingId) {
        setContributions(
          contributions.map((item) =>
            item.id === editingId
              ? { ...item, name, payment, date: formattedDate }
              : item
          )
        );
        setEditingId(null);
      } else {
        setContributions([
          ...contributions,
          { id: Date.now().toString(), name, payment, date: formattedDate },
        ]);
      }
      setName('');
      setPayment('');
      setDate(new Date());
    }
  };

  const editContribution = (id) => {
    const contribution = contributions.find((item) => item.id === id);
    if (contribution) {
      setName(contribution.name);
      setPayment(contribution.payment);
      setDate(new Date(contribution.date));
      setEditingId(contribution.id);
    }
  };

  const deleteContribution = (id) => {
    setContributions(contributions.filter((item) => item.id !== id));
  };

  // Render header row
  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <View style={[styles.headerColumn, { flex: 2 }]}>
        <Text style={styles.headerText}>Name</Text>
      </View>
      <View style={[styles.headerColumn, { flex: 1 }]}>
        <Text style={styles.headerText}>Amount</Text>
      </View>
      <View style={[styles.headerColumn, { flex: 1 }]}>
        <Text style={styles.headerText}>Date</Text>
      </View>
      <View style={[styles.headerColumn, { flex: 1 }]}>
        <Text style={styles.headerText}>Actions</Text>
      </View>
    </View>
  );

  // Render each contribution row
  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={[styles.dataColumn, { flex: 2 }]}>
        <Text style={styles.dataText}>{item.name}</Text>
      </View>
      <View style={[styles.dataColumn, { flex: 1 }]}>
        <Text style={styles.dataText}>${item.payment}</Text>
      </View>
      <View style={[styles.dataColumn, { flex: 1 }]}>
        <Text style={styles.dataText}>{item.date}</Text>
      </View>
      <View style={[styles.dataColumn, styles.actionColumn, { flex: 1 }]}>
        <TouchableOpacity onPress={() => editContribution(item.id)} style={styles.editButton}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteContribution(item.id)} style={styles.deleteButton}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const totalPayment = contributions.reduce(
    (sum, item) => sum + parseFloat(item.payment),
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Contribution</Text>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Payment Amount"
          value={payment}
          onChangeText={setPayment}
          keyboardType="numeric"
        />
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Text style={styles.dateText}>Select Date: {formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        <Button
          title={editingId ? "Update Contribution" : "Add Contribution"}
          onPress={addOrUpdateContribution}
        />
      </View>

      {/* Table Header */}
      {renderHeader()}

      {/* Contributions List */}
      <FlatList
        data={sortedContributions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No contributions yet.</Text>}
        contentContainerStyle={styles.listContent}
      />

      {/* Total Payment Display */}
      <View style={styles.totalContainer}>
        <Text style={styles.total}>Total Payment: ${totalPayment.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dateButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  headerColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  dataColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataText: {
    fontSize: 14,
    color: '#333',
  },
  actionColumn: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  totalContainer: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});
