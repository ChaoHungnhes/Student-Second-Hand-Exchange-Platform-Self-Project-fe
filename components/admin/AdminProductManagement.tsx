
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductStatus } from '../../types';

interface Props {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

const AdminProductManagement: React.FC<Props> = ({ products, onEdit, onDelete }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = [...products];
    if (keyword) result = result.filter(p => p.title.toLowerCase().includes(keyword.toLowerCase()));
    if (statusFilter !== 'ALL') result = result.filter(p => p.status === statusFilter);
    return result;
  }, [products, keyword, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tất cả sản phẩm</h1>
      
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input type="text" placeholder="Từ khóa..." value={keyword} onChange={e => setKeyword(e.target.value)} className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold">
          <option value="ALL">Mọi trạng thái</option>
          {Object.values(ProductStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <img src={p.imageUrls[0]} className="w-12 h-12 rounded-2xl object-cover" alt="p" />
                    <div className="max-w-[200px]">
                      <p className="text-sm font-black text-gray-900 truncate">{p.title}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">#{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-black text-indigo-600">{p.price.toLocaleString()}đ</td>
                <td className="px-8 py-5 text-xs font-bold">{p.status}</td>
                <td className="px-8 py-5 flex gap-2">
                  <Link to={`/product/${p.id}`} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white"><i className="fa-solid fa-eye"></i></Link>
                  <button onClick={() => onEdit(p)} className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white"><i className="fa-solid fa-pen"></i></button>
                  <button onClick={() => onDelete(p.id)} className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white"><i className="fa-solid fa-trash-can"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductManagement;
