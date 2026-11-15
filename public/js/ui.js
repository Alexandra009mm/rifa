/**
 * UI rendering and DOM manipulation module
 */
const UI = {
  /**
   * Safe HTML escaping helper
   */
  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  },

  /**
   * Currency formatter in Colombian Pesos
   */
  formatMoney(amount) {
    const num = Number(amount) || 0;
    return '$' + num.toLocaleString('es-CO');
  },

  /**
   * Renders a friendly error banner in the grid and table if connection fails
   */
  renderError(message, onRetry) {
    const grid = document.getElementById('grid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b;">
          <h4 style="margin: 0 0 8px; font-size: 1.1rem;">⚠️ Esperando conexión con la base de datos</h4>
          <p style="margin: 0 0 14px; font-size: 0.9rem; color: #7f1d1d;">${this.escape(message)}</p>
          <button type="button" class="sec" id="btn-grid-retry" style="background:#ffffff; color:#991b1b; border:1px solid #fca5a5; font-size: 0.85rem; padding: 8px 16px;">🔄 Reintentar conexión</button>
        </div>
      `;
      document.getElementById('btn-grid-retry')?.addEventListener('click', onRetry);
    }

    const tbody = document.getElementById('lista');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#991b1b; padding:20px;">No se pudieron cargar los compradores. Haz clic en "Reintentar conexión" arriba.</td></tr>`;
    }
  },

  /**
   * Displays temporary floating toast notification
   */
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${this.escape(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  /**
   * Renders summary statistics on top dashboard
   */
  renderStats(stats) {
    if (!stats) return;
    document.getElementById('vendidos').textContent = stats.sold;
    document.getElementById('disponibles').textContent = stats.available;
    document.getElementById('recaudado').textContent = this.formatMoney(stats.totalCollected);
    document.getElementById('pendiente-cobrar').textContent = this.formatMoney(stats.pendingToCollect);
  },

  /**
   * Renders the 100 ticket grid
   */
  renderGrid(tickets, onNumberClick, activeFilter = 'todos', searchQuery = '') {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    const query = searchQuery.trim().toLowerCase();

    tickets.forEach(ticket => {
      const btn = document.createElement('button');
      btn.className = `num ${ticket.status}`;
      btn.textContent = ticket.ticketNumber;
      btn.dataset.number = ticket.ticketNumber;

      // Tooltip description
      let title = `Número ${ticket.ticketNumber}`;
      if (ticket.buyerName) {
        if (ticket.status === 'pagado') {
          title += `: ${ticket.buyerName} (PAGADO ✅)`;
        } else if (ticket.status === 'abono') {
          title += `: ${ticket.buyerName} (Abonó ${this.formatMoney(ticket.amountPaid)})`;
        } else {
          title += `: ${ticket.buyerName} (Pendiente ⏳)`;
        }
      } else {
        title += ': Disponible';
      }
      btn.title = title;

      // Search match highlight
      const matchesSearch = query && (
        (ticket.buyerName && ticket.buyerName.toLowerCase().includes(query)) ||
        ticket.ticketNumber.includes(query)
      );

      if (matchesSearch) {
        btn.classList.add('resaltado');
      }

      // Filter check
      let matchesFilter = true;
      if (activeFilter === 'vendidos') matchesFilter = !!ticket.buyerName;
      else if (activeFilter === 'disponibles') matchesFilter = !ticket.buyerName;
      else if (activeFilter === 'pagado') matchesFilter = ticket.status === 'pagado';
      else if (activeFilter === 'abono') matchesFilter = ticket.status === 'abono';
      else if (activeFilter === 'pendiente') matchesFilter = ticket.status === 'pendiente';

      if (query && !matchesSearch) {
        btn.classList.add('oculto');
      } else if (!matchesFilter) {
        btn.classList.add('oculto');
      }

      btn.onclick = () => onNumberClick(ticket.ticketNumber);
      grid.appendChild(btn);
    });
  },

  /**
   * Renders table of buyers with strikethrough for paid and status badges
   */
  renderTable(tickets, onRowClick, activeFilter = 'todos', searchQuery = '') {
    const tbody = document.getElementById('lista');
    tbody.innerHTML = '';

    const query = searchQuery.trim().toLowerCase();

    // Filter only assigned tickets
    const soldTickets = tickets.filter(t => {
      if (!t.buyerName) return false;

      if (query) {
        const matchesQuery = t.buyerName.toLowerCase().includes(query) || t.ticketNumber.includes(query);
        if (!matchesQuery) return false;
      }

      if (activeFilter === 'pagado') return t.status === 'pagado';
      if (activeFilter === 'abono') return t.status === 'abono';
      if (activeFilter === 'pendiente') return t.status === 'pendiente';

      return true;
    });

    if (soldTickets.length === 0) {
      let emptyMsg = 'No se encontraron compradores con los filtros actuales.';
      if (activeFilter === 'abono') {
        emptyMsg = 'No hay compradores con <b>abonos parciales</b> registrados todavía. Haz clic en la pestaña <b>"Todos"</b> para ver los compradores.';
      } else if (activeFilter === 'pagado') {
        emptyMsg = 'No hay compradores marcados como pagados con este filtro.';
      }
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#64748b;padding:20px;">${emptyMsg}</td></tr>`;
      return;
    }

    soldTickets.forEach(ticket => {
      const tr = document.createElement('tr');

      // Paid items get strikethrough class on name
      const isPaid = ticket.status === 'pagado';
      const isAbono = ticket.status === 'abono';
      const nameClass = isPaid ? 'buyer-name tachado' : 'buyer-name';

      // Build status badge
      let badgeHtml = '';
      if (isPaid) {
        badgeHtml = `<span class="status-badge pagado">✅ Pagado (${this.formatMoney(ticket.amountPaid)})</span>`;
      } else if (isAbono) {
        const remaining = 10000 - ticket.amountPaid;
        badgeHtml = `<span class="status-badge abono">💳 Abonó ${this.formatMoney(ticket.amountPaid)} <small>(Resta ${this.formatMoney(remaining)})</small></span>`;
      } else {
        badgeHtml = `<span class="status-badge pendiente">⏳ Pendiente (${this.formatMoney(10000)})</span>`;
      }

      tr.innerHTML = `
        <td style="width: 60px;"><span class="num-badge">${ticket.ticketNumber}</span></td>
        <td><span class="${nameClass}">${this.escape(ticket.buyerName)}</span></td>
        <td>${badgeHtml}</td>
        <td style="width: 80px; text-align: right;">
          <button class="btn-table-edit" title="Modificar número o pago">Editar</button>
        </td>
      `;

      tr.querySelector('.btn-table-edit').onclick = () => onRowClick(ticket.ticketNumber);
      tbody.appendChild(tr);
    });
  }
};

window.UI = UI;
