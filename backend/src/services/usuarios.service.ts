import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

export class UsuariosService {
    private validarDatos(data: any, requierePassword: boolean) {
        const nombre = String(data.nombre ?? '').trim();
        const cedula = String(data.cedula ?? '').trim();
        const email = String(data.email ?? '').trim().toLowerCase();
        const password = String(data.password ?? '');
        const rolesValidos = ['ADMINISTRADOR', 'VENDEDOR', 'CAJERO'];

        if (nombre.length < 2 || nombre.length > 100) throw new Error('El nombre debe tener entre 2 y 100 caracteres.');
        if (!/^\d{10}$/.test(cedula)) throw new Error('La cédula debe contener exactamente 10 dígitos.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Ingresa un correo electrónico válido.');
        if (requierePassword && password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        if (!requierePassword && password && password.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        if (!rolesValidos.includes(data.rol)) throw new Error('El rol seleccionado no es válido.');

        return { nombre, cedula, email, password };
    }

    private async verificarAcceso(id: string, rolPeticion: string, negocioIdDelAdmin?: string) {
        const usuario = await prisma.socio.findUnique({ where: { id } });
        if (!usuario) throw new Error('El usuario no existe.');
        if (rolPeticion !== 'SUPERADMIN' && usuario.negocioId !== negocioIdDelAdmin) {
            throw new Error('No tienes permiso para gestionar este usuario.');
        }
        return usuario;
    }

    // SUPERADMIN obtiene todos (incluyendo el nombre de la empresa para la tabla)
    // ADMIN obtiene solo los de su negocioId
    async obtenerUsuarios(rolPeticion: string, negocioIdDelAdmin?: string) {
        const select = {
            id: true,
            negocioId: true,
            nombre: true,
            cedula: true,
            email: true,
            rol: true,
            negocio: true
        };

        if (rolPeticion === 'SUPERADMIN') {
            return prisma.socio.findMany({
                where: { rol: { not: 'CLIENTE' } },
                select
            });
        }

        return prisma.socio.findMany({
            where: { negocioId: negocioIdDelAdmin, rol: { not: 'CLIENTE' } },
            select
        });
    }

    // SUPERADMIN debe enviar data.negocioId
    // ADMIN usa su propio negocioIdDelAdmin automáticamente
    async crearUsuario(rolPeticion: string, data: any, negocioIdDelAdmin?: string) {
        const negocioIdFinal = rolPeticion === 'SUPERADMIN' ? data.negocioId : negocioIdDelAdmin;
        const datos = this.validarDatos(data, true);

        if (!negocioIdFinal) {
            throw new Error('Debe especificar a qué empresa pertenece el usuario.');
        }

        const passwordHash = await bcrypt.hash(datos.password, 10);

        return prisma.socio.create({
            data: {
                nombre: datos.nombre,
                cedula: datos.cedula,
                email: datos.email,
                password: passwordHash,
                rol: data.rol,
                negocioId: negocioIdFinal
            }
        });
    }

    async actualizarUsuario(id: string, data: any, rolPeticion: string, negocioIdDelAdmin?: string) {
        await this.verificarAcceso(id, rolPeticion, negocioIdDelAdmin);
        const datos = this.validarDatos(data, false);
        const updateData: any = {
            nombre: datos.nombre,
            cedula: datos.cedula,
            email: datos.email,
            rol: data.rol,
        };

        if (rolPeticion === 'SUPERADMIN' && data.negocioId) {
            updateData.negocioId = data.negocioId;
        }

        if (datos.password) {
            updateData.password = await bcrypt.hash(datos.password, 10);
        }

        return prisma.socio.update({
            where: { id },
            data: updateData
        });
    }

    // Borrado físico (porque no tenemos campo 'activo' en el modelo Socio)
    async eliminarUsuario(id: string, rolPeticion: string, negocioIdDelAdmin?: string) {
        await this.verificarAcceso(id, rolPeticion, negocioIdDelAdmin);
        return prisma.socio.delete({
            where: { id }
        });
    }
}
