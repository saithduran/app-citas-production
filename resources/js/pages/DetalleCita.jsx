import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import DatePicker from 'react-datepicker';
import { es } from "date-fns/locale";
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../../css/detallecita.module.css';
import Select from 'react-select'; // Para autocompletado de nombres
import axios from 'axios';

function DetalleCita() {
    const { codigo } = useParams();
    const navigate = useNavigate();
    const [cita, setCita] = useState(null);
    const [editando, setEditando] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedUsuario, setSelectedUsuario] = useState(null); // Estado para el tutor seleccionado
    const [usuarios, setUsuarios] = useState([]);
    const [idUsuario, setIdUsuario] = useState('');
    const [celular, setCelular] = useState('');
    const [selectedTutor, setSelectedTutor] = useState(null); // Estado para el tutor seleccionado
    const [idTutor, setIdTutor] = useState('');
    const [tutores, setTutores] = useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [mensajeExito, setMensajeExito] = useState("");
    const [error, setError] = useState('');
    const [errorCelular, setErrorCelular] = useState('');
    //Capturar usuario para dshboard
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/user', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Error al obtener el usuario', error);
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };
        fetchUser();

        const obtenerUsuarios = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/usuarios', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setUsuarios(response.data);
            } catch (error) {
                setError("Error al obtener usuarios.");
                console.error("Error:", error);
            }
        };
        obtenerUsuarios();

        const obtenerTutores = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/tutores', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setTutores(response.data);
            } catch (error) {
                setError("Error al obtener usuarios.");
                console.error("Error:", error);
            }
        };
        obtenerTutores();
    }, [navigate]);

    //obtener detalles de la cita y capturarlos
    useEffect(() => {
        const fetchCita = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/cita/${codigo}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                //console.log(response.data);
                setCita(response.data);
                setSelectedDate(response.data.fecha ? new Date(response.data.fecha + "T00:00:00") : new Date());
                setSelectedTime(convertirHora24a12(response.data.hora));
    
                // Establece el valor inicial del Select
                if (response.data.tutores) {
                    setSelectedTutor({
                        label: response.data.tutores.nombre_completo,
                        value: response.data.tutores.id
                    });
                }
                // Establece el valor inicial del Select
                console.log(response.data);
                if (response.data.usuario) {
                    setSelectedUsuario({
                        label: response.data.usuario.nombre,
                        celular: response.data.usuario.celular,
                        value: response.data.usuario.id
                    });
                }
            } catch (error) {
                console.error('Error al obtener los detalles de la cita', error);
            }
        };
        fetchCita();
    }, [codigo]);

    //obtener los horarios y capturarlos
    useEffect(() => {
        if (!selectedDate) return;
        const fechaISO = selectedDate.toISOString().split('T')[0];
    
        const obtenerHorariosDisponibles = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/horarios-disponibles/${fechaISO}`);
                if (Array.isArray(response.data)) {
                    setHorariosDisponibles(response.data.map(convertirHora24a12));
                }
            } catch (error) {
                console.error('Error al obtener horarios disponibles', error);
            }
        };
        obtenerHorariosDisponibles();
    }, [selectedDate]);   

    const convertirHora24a12 = (hora24) => {
        if (!hora24) return "";
        const [hora, minutos] = hora24.split(':'); // Ignoramos segundos si existen
        let hora12 = parseInt(hora, 10);
        const periodo = hora12 >= 12 ? 'PM' : 'AM';
        if (hora12 > 12) hora12 -= 12;
        if (hora12 === 0) hora12 = 12;
        return `${String(hora12).padStart(2, '0')}:${minutos} ${periodo}`;
    };
    
    const convertirHora12a24 = (hora12) => {
        const [hora, minutos, periodo] = hora12.match(/(\d+):(\d+) (\w+)/).slice(1);
        let hora24 = parseInt(hora, 10);
        if (periodo === 'PM' && hora24 !== 12) hora24 += 12;
        if (periodo === 'AM' && hora24 === 12) hora24 = 0;
        return `${String(hora24).padStart(2, '0')}:${minutos}`;
    }; 

    const handleSeleccionUsuario = (selectedOption) => {
        setSelectedUsuario(selectedOption);
        setCelular(selectedOption.celular);
        setIdUsuario(selectedOption.value);
    };

    const handleSeleccionTutor = (selectedOption) => {
        setSelectedTutor(selectedOption); // Guarda el tutor seleccionado
        setIdTutor(selectedOption.value); // Guarda el ID del tutor
    };

    const handleEdit = async () => {
        // Datos que se enviarán en la solicitud
        const datos = {
            usuario_id: selectedUsuario.value,
            tutor_id: selectedTutor.value,
            fecha: selectedDate.toISOString().split('T')[0],
            hora: convertirHora12a24(selectedTime),
        };
    
        // Imprimir los datos en la consola
        console.log("Datos enviados:", datos);
    
        try {
            // Realizar la solicitud PUT
            const response = await axios.put(
                `http://localhost:8000/api/cita/${codigo}`,
                datos,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
    
            // Imprimir la respuesta del servidor
            console.log("Respuesta del servidor:", response.data);
    
            // Actualizar el estado de la cita
            setCita({
                ...cita,
                usuario_id: selectedUsuario.value,
                tutor_id: selectedTutor.value,
                fecha: selectedDate.toISOString().split('T')[0],
                hora: convertirHora12a24(selectedTime),
            });
    
            // Mostrar mensaje de éxito
            setMensajeExito('✅ Cita actualizada con éxito.');
            setEditando(false);
        } catch (error) {
            console.error('Error al actualizar la cita', error);
    
            // Imprimir el error en la consola
            if (error.response) {
                console.error("Respuesta de error del servidor:", error.response.data);
            }
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;

        try {
            await axios.delete(`http://localhost:8000/api/cita/${codigo}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            alert('Cita cancelada con éxito');
            navigate('/dashboard'); // Redirige al calendario después de cancelar
        } catch (error) {
            console.error('Error al cancelar la cita', error);
        }
    };

    return (
        <div>
            <Navbar user={user} />
            <div className={styles.detalleContainer}>
                <div className={styles.detalleCard}>
                    <h2 className="detalle-title">Detalles de la Cita</h2>
                    {mensajeExito && <div className="alerta-exito">{mensajeExito}</div>}
                    {error && <p className="error-message">{error}</p>}
                    {errorCelular && <p className="error-message">{errorCelular}</p>}
                    {editando ? (
                        <div>
                            <label className='mt-3'>Nombre:</label>
                            <Select
                                options={usuarios.map(user => ({ 
                                    label: user.nombre, 
                                    celular: user.celular, 
                                    value: user.id 
                                }))}
                                onChange={handleSeleccionUsuario}
                                placeholder="Ingresa o selecciona un nombre"
                                className="input-field"
                                value={selectedUsuario}
                            />
                            <label className='mt-3'>Celular:</label>
                            <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} className="input-field" maxLength={10} disabled/>
                            <label className='mt-3'>Encargado:</label>
                            <Select
                                options={tutores.map(tutor => ({
                                    label: tutor.nombre_completo,
                                    value: tutor.id // Usa "value" en lugar de "idTutor"
                                }))}
                                onChange={handleSeleccionTutor}
                                placeholder="Ingresa o selecciona un nombre"
                                className="input-field"
                                value={selectedTutor} // Pasa el objeto seleccionado
                            />
                            <label className='mt-3'>Fecha:</label>
                            <DatePicker selected={selectedDate} onChange={setSelectedDate} dateFormat="dd/MM/yyyy" minDate={new Date()} locale={es} className="input-field"/>
                            <label className='mt-3'>Hora:</label>
                            <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                                <option value="">Selecciona un horario</option>
                                {horariosDisponibles.map((horario, index) => (
                                    <option key={index} value={horario}>{horario}</option>
                                ))}
                            </select>
                            <button onClick={handleEdit} className={`${styles.detalleButtons} ${styles.editar}`}>Guardar</button>
                            <button onClick={() => setEditando(false)} className={`${styles.detalleButtons} ${styles.cancelar}`}>Volver</button>
                        </div>
                    ) : (
                        <div>
                            <p><strong>Nombre:</strong> {cita?.usuario.nombre}</p>
                            <p><strong>Celular:</strong> {cita?.usuario.celular}</p>
                            <p><strong>Encargado:</strong> {cita?.tutores.nombre_completo}</p>
                            <p><strong>Fecha:</strong> {cita?.fecha}</p>
                            <p><strong>Hora:</strong> {cita?.hora ? convertirHora24a12(cita.hora) : ''}</p>
                            <button onClick={() => setEditando(true)} className={`${styles.detalleButtons} ${styles.editar}`}>Editar</button>
                            <button onClick={handleDelete} className={`${styles.detalleButtons} ${styles.cancelar}`}>Cancelar Cita</button>
                            <Link to="/dashboard">
                                <button className={`${styles.detalleButtons} ${styles.back}`}>Volver al Inicio</button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DetalleCita;
