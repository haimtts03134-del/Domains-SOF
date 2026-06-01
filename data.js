const STORAGE_KEY = 'royalCowDB';

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatRevenueReadable(amount) {
  const value = Number(amount) || 0;
  if (value >= 1000000000) {
    const result = value / 1000000000;
    return `${result % 1 === 0 ? result.toFixed(0) : result.toFixed(1)} tỷ`;
  }
  if (value >= 1000000) {
    const result = value / 1000000;
    return `${result % 1 === 0 ? result.toFixed(0) : result.toFixed(1)} triệu`;
  }
  return `${value} đ`;
}

const cattleCounts = {
  Angus: 560,
  Brahman: 430,
  Local: 710
};
Object.defineProperty(cattleCounts, 'total', {
  get() {
    return Object.entries(this).reduce((sum, [key, value]) => {
      return key === 'total' ? sum : sum + Number(value || 0);
    }, 0);
  },
  enumerable: false
});

const RoyalCowDB = {
  revenue: {
    current: 2400000000,
    history: [
      { month: '02/2026', amount: 1850000000 },
      { month: '03/2026', amount: 1980000000 },
      { month: '04/2026', amount: 2170000000 },
      { month: '05/2026', amount: 2400000000 }
    ]
  },
  cattleCounts,
  breeds: [
    { name: 'Angus', subtitle: 'Tiêu chuẩn thịt mềm, sức khỏe ổn định.' },
    { name: 'Brahman', subtitle: 'Chịu nhiệt tốt, phù hợp chuồng trại.' },
    { name: 'Local', subtitle: 'Giống bản địa, dễ chăm sóc.' }
  ],
  cattleRecords: [
    { tag: 'TAG-901', breed: 'Angus', weight: '612 kg', health: 'Rất tốt', status: 'Tốt', inspected: '30/05/2026' },
    { tag: 'TAG-914', breed: 'Brahman', weight: '588 kg', health: 'Ổn định', status: 'Ổn định', inspected: '29/05/2026' },
    { tag: 'TAG-927', breed: 'Local', weight: '534 kg', health: 'Cần theo dõi', status: 'Cần theo dõi', inspected: '28/05/2026' }
  ],
  vaccineSchedules: [
    { id: 'VAX-001', cattleTag: 'TAG-901', vaccineName: 'Bệnh ngoại hình gia súc', vaccinationDate: '01/06/2026', nextDueDate: '01/08/2026', status: 'Hoàn thành' },
    { id: 'VAX-002', cattleTag: 'TAG-914', vaccineName: 'Thương hàn cấp tính', vaccinationDate: '', nextDueDate: '05/06/2026', status: 'Đang chờ' }
  ],
  orders: [
    { id: 'DH-881', customer: 'Hệ thống nhà hàng', status: 'Đang duyệt', amount: 1100000000, breedRequired: 'Angus', estimatedDeliveryDate: '' },
    { id: 'DH-892', customer: 'Đối tác miền Bắc', status: 'Đã xác nhận', amount: 310000000, breedRequired: 'Brahman', estimatedDeliveryDate: '' }
  ],
  save() {
    const payload = {
      revenue: { current: this.revenue.current, history: this.revenue.history },
      cattleCounts: Object.fromEntries(
        Object.entries(this.cattleCounts).filter(([key]) => key !== 'total')
      ),
      breeds: this.breeds,
      cattleRecords: this.cattleRecords,
      vaccineSchedules: this.vaccineSchedules,
      orders: this.orders
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const data = JSON.parse(raw);
      if (data?.revenue?.current != null) {
        this.revenue.current = data.revenue.current;
      }
      if (data?.revenue?.history) {
        this.revenue.history = data.revenue.history;
      }
      if (data?.cattleCounts) {
        Object.entries(data.cattleCounts).forEach(([key, value]) => {
          this.cattleCounts[key] = Number(value) || 0;
        });
      }
      if (Array.isArray(data?.breeds)) {
        this.breeds = data.breeds;
      }
      if (Array.isArray(data?.cattleRecords)) {
        this.cattleRecords = data.cattleRecords;
      }
      if (Array.isArray(data?.vaccineSchedules)) {
        this.vaccineSchedules = data.vaccineSchedules;
      }
      if (Array.isArray(data?.orders)) {
        this.orders = data.orders;
      }
    } catch (error) {
      console.warn('Không thể tải RoyalCowDB từ localStorage:', error);
    }
  },
  updateRevenue(amount) {
    this.revenue.current = Number(amount) || this.revenue.current;
    this.save();
  },
  addBreed(name, subtitle = 'Giống mới được thêm bởi hệ thống.') {
    if (!name) {
      return;
    }
    const normalized = name.trim();
    const existing = this.breeds.find((breed) => breed.name.toLowerCase() === normalized.toLowerCase());
    if (existing) {
      return existing;
    }
    const newBreed = { name: normalized, subtitle };
    this.breeds.push(newBreed);
    this.cattleCounts[normalized] = 0;
    this.save();
    return newBreed;
  },
  setBreedCount(name, count) {
    if (!name) {
      return;
    }
    this.cattleCounts[name] = Number(count) || 0;
    this.save();
  },
  addRecord(record) {
    if (!record?.tag || !record?.breed) {
      return;
    }
    const normalizedBreed = record.breed.trim();
    const savedRecord = {
      tag: record.tag.trim(),
      breed: normalizedBreed,
      weight: record.weight.trim(),
      health: record.health.trim(),
      status: record.status || 'Đã ghi nhận',
      inspected: record.inspected || new Intl.DateTimeFormat('vi-VN').format(new Date())
    };
    this.cattleRecords.push(savedRecord);
    this.addBreed(normalizedBreed);
    this.save();
  },
  updateRecord(index, record) {
    if (index < 0 || index >= this.cattleRecords.length || !record?.tag || !record?.breed) {
      return;
    }
    const normalizedBreed = record.breed.trim();
    this.cattleRecords[index] = {
      tag: record.tag.trim(),
      breed: normalizedBreed,
      weight: record.weight.trim(),
      health: record.health.trim(),
      status: record.status || this.cattleRecords[index].status,
      inspected: record.inspected || this.cattleRecords[index].inspected
    };
    this.addBreed(normalizedBreed);
    this.save();
  },
  addOrder(order) {
    if (!order?.customer || order?.amount == null) {
      return;
    }
    const id = `DH-${String(900 + this.orders.length + 1).padStart(3, '0')}`;
    this.orders.push({
      id,
      customer: order.customer.trim(),
      status: order.status || (order.proposedByStaff ? 'Đề xuất' : 'Đang xử lý'),
      amount: Number(order.amount) || 0,
      breedRequired: order.breedRequired?.trim() || '',
      estimatedDeliveryDate: order.estimatedDeliveryDate || '',
      proposedByStaff: Boolean(order.proposedByStaff),
      note: order.note?.trim() || ''
    });
    this.save();
  },
  updateOrder(index, order) {
    if (index < 0 || index >= this.orders.length || !order?.customer || !order?.amount) {
      return;
    }
    this.orders[index] = {
      id: this.orders[index].id,
      customer: order.customer.trim(),
      status: order.status || this.orders[index].status,
      amount: Number(order.amount) || this.orders[index].amount,
      breedRequired: order.breedRequired?.trim() || this.orders[index].breedRequired || '',
      estimatedDeliveryDate: order.estimatedDeliveryDate || this.orders[index].estimatedDeliveryDate || '',
      proposedByStaff: order.proposedByStaff !== undefined ? order.proposedByStaff : this.orders[index].proposedByStaff,
      note: order.note?.trim() || this.orders[index].note || ''
    };
    this.save();
  },
  deleteOrder(index) {
    if (index < 0 || index >= this.orders.length) {
      return;
    }
    this.orders.splice(index, 1);
    this.save();
  },
  approveOrder(index) {
    if (index < 0 || index >= this.orders.length) {
      return;
    }
    this.orders[index].approvedDate = new Intl.DateTimeFormat('vi-VN').format(new Date());
    const estimatedDate = this.orders[index].estimatedDeliveryDate ? new Date(this.orders[index].estimatedDeliveryDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (estimatedDate) {
      estimatedDate.setHours(0, 0, 0, 0);
      this.orders[index].status = today >= estimatedDate ? 'Đã giao' : 'Đang vận chuyển';
    } else {
      this.orders[index].status = 'Đã phê duyệt';
    }
    this.save();
  },
  getApprovedTransactions() {
    return this.orders
      .filter((order) => ['Đã phê duyệt', 'Đang vận chuyển', 'Đã giao'].includes(order.status))
      .map((order) => ({
        id: order.id,
        date: order.approvedDate || new Intl.DateTimeFormat('vi-VN').format(new Date()),
        cattle: order.customer,
        value: order.amount,
        status: order.status
      }));
  },
  addVaccineSchedule(schedule) {
    if (!schedule?.cattleTag || !schedule?.vaccineName || !schedule?.nextDueDate) {
      return;
    }
    const id = `VAX-${String(900 + this.vaccineSchedules.length + 1).padStart(3, '0')}`;
    this.vaccineSchedules.push({
      id,
      cattleTag: schedule.cattleTag.trim(),
      vaccineName: schedule.vaccineName.trim(),
      vaccinationDate: schedule.vaccinationDate || '',
      nextDueDate: schedule.nextDueDate,
      status: schedule.status || 'Đang chờ'
    });
    this.save();
  },
  updateVaccineSchedule(index, schedule) {
    if (index < 0 || index >= this.vaccineSchedules.length || !schedule?.cattleTag || !schedule?.vaccineName) {
      return;
    }
    this.vaccineSchedules[index] = {
      id: this.vaccineSchedules[index].id,
      cattleTag: schedule.cattleTag.trim(),
      vaccineName: schedule.vaccineName.trim(),
      vaccinationDate: schedule.vaccinationDate || this.vaccineSchedules[index].vaccinationDate || '',
      nextDueDate: schedule.nextDueDate || this.vaccineSchedules[index].nextDueDate,
      status: schedule.status || this.vaccineSchedules[index].status
    };
    this.save();
  },
  deleteVaccineSchedule(index) {
    if (index < 0 || index >= this.vaccineSchedules.length) {
      return;
    }
    this.vaccineSchedules.splice(index, 1);
    this.save();
  },
  completeVaccination(index) {
    if (index < 0 || index >= this.vaccineSchedules.length) {
      return;
    }
    this.vaccineSchedules[index].status = 'Hoàn thành';
    this.vaccineSchedules[index].vaccinationDate = new Intl.DateTimeFormat('vi-VN').format(new Date());
    this.save();
  }
};

RoyalCowDB.load();