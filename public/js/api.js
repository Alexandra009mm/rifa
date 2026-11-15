/**
 * API client module for Raffle backend communication
 */
const API = {
  baseUrl: '/api/tickets',

  /**
   * Retrieves all tickets with optional search query and status filter
   */
  async getTickets(query = '', status = '') {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (status) params.append('status', status);

    const res = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!res.ok) throw new Error('Error al cargar números de la rifa');
    const json = await res.json();
    return json.data;
  },

  /**
   * Retrieves single ticket by number
   */
  async getTicket(number) {
    const res = await fetch(`${this.baseUrl}/${number}`);
    if (!res.ok) throw new Error(`Error al consultar número ${number}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Retrieves summary statistics (sold, available, total collected, etc.)
   */
  async getStats() {
    const res = await fetch(`${this.baseUrl}/stats`);
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    const json = await res.json();
    return json.data;
  },

  /**
   * Updates buyer name and payment status for a ticket
   */
  async updateTicket(number, payload) {
    const res = await fetch(`${this.baseUrl}/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Error al actualizar número');
    }
    return json.data;
  },

  /**
   * Releases an assigned ticket back to available
   */
  async releaseTicket(number) {
    const res = await fetch(`${this.baseUrl}/${number}/release`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Error al liberar número');
    }
    return json.data;
  },

  /**
   * Resets all tickets with safety confirmation text
   */
  async resetAll(confirmation) {
    const res = await fetch(`${this.baseUrl}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Error al reiniciar la rifa');
    }
    return json;
  },

  /**
   * Retrieves formatted plain text list for copying
   */
  async getExportList() {
    const res = await fetch(`${this.baseUrl}/export`);
    if (!res.ok) throw new Error('Error al exportar lista');
    const json = await res.json();
    return json.data;
  }
};

window.API = API;
