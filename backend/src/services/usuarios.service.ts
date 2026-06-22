import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

export class UsuariosService {

    // SUPERADMIN obtiene todos (incluyendo el nombre de la empresa para la tabla)
    // ADMIN obtiene solo los de su negocioId
    async obtenerUsuarios(rolPeticion: string, negocioIdDelAdmin?: string) {
        if (rolPeticion === 'SUPERADMIN') {
            return prisma.socio.findMany({
                include: { negocio: true }
            });
        }

        return prisma.socio.findMany({
            where: { negocioId: negocioIdDelAdmin },
            include: { negocio: true }
        });
    }

    // SUPERADMIN debe enviar data.negocioId
    // ADMIN usa su propio negocioIdDelAdmin automáticamente
    async crearUsuario(rolPeticion: string, data: any, negocioIdDelAdmin?: string) {
        const negocioIdFinal = rolPeticion === 'SUPERADMIN' ? data.negocioId : negocioIdDelAdmin;

        if (!negocioIdFinal) {
            throw new Error('Debe especificar a qué empresa pertenece el usuario.');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        return prisma.socio.create({
            data: {
                nombre: data.nombre,
                email: data.email,
                password: passwordHash,
                rol: data.rol,
                negocioId: negocioIdFinal
            }
        });
    }

    async actualizarUsuario(id: string, data: any) {
        const updateData: any = {
            nombre: data.nombre,
            email: data.email,
            rol: data.rol,
        };

        if (data.negocioId) {
            updateData.negocioId = data.negocioId;
        }

        if (data.password && data.password.trim() !== '') {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return prisma.socio.update({
            where: { id },
            data: updateData
        });
    }

    // Borrado físico (porque no tenemos campo 'activo' en el modelo Socio)
    async eliminarUsuario(id: string) {
        return prisma.socio.delete({
            where: { id }
        });
    }
}