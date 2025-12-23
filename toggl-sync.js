body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 12px;
  background: #fff;
  font-size: 14px;
}

.container {
  max-width: 100%;
}

.section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.section:last-child {
  border-bottom: none;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #172b4d;
}

.input {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid #dfe1e6;
  border-radius: 3px;
  font-size: 14px;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #0079bf;
  box-shadow: 0 0 0 1px #0079bf;
}

.button {
  width: 100%;
  padding: 8px 12px;
  background: #0079bf;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.button:hover {
  background: #026aa7;
}

.button:active {
  background: #055a8c;
}

.transaction-item {
  padding: 12px 12px 40px 12px;
  margin-bottom: 8px;
  background: #f4f5f7;
  border-radius: 3px;
  position: relative;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.transaction-type {
  font-weight: 600;
  font-size: 13px;
}

.transaction-type.charge {
  color: #c9372c;
}

.transaction-type.payment {
  color: #61bd4f;
}

.transaction-details {
  font-size: 12px;
  color: #5e6c84;
}

.delete-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 8px;
  font-size: 11px;
  background: #fff;
  border: 1px solid #dfe1e6;
  border-radius: 3px;
  cursor: pointer;
  color: #5e6c84;
}

.delete-btn:hover {
  background: #f4f5f7;
  color: #172b4d;
}

.amount-red {
  color: #c9372c;
  font-weight: 600;
}

.amount-green {
  color: #61bd4f;
  font-weight: 600;
}

.summary {
  background: #f9fafc;
  padding: 12px;
  border-radius: 3px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.summary-row.total {
  border-top: 2px solid #dfe1e6;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: 600;
  font-size: 16px;
}

.no-data {
  text-align: center;
  color: #5e6c84;
  padding: 20px;
  font-style: italic;
}

#transactionList {
  max-height: 300px;
  overflow-y: auto;
}

#transactionList::-webkit-scrollbar {
  width: 8px;
}

#transactionList::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

#transactionList::-webkit-scrollbar-thumb {
  background: #c1c7d0;
  border-radius: 4px;
}

#transactionList::-webkit-scrollbar-thumb:hover {
  background: #a5adba;
}
