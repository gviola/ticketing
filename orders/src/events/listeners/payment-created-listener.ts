import { Message } from 'node-nats-streaming';
import { Subjects, Listener, PaymentCreatedEvent, OrderStatus } from '@gvtickets/common';
import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
    subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
        const { orderId } = data;

        const order = await Order.findById(orderId);
       
        if (!order) {
            throw new Error('Order not found');
        }

        order.set({
            status: OrderStatus.Complete
        });

        await order.save();

        // we should emit an event event updated

        msg.ack();
    }
}