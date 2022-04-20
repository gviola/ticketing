import { Listener, OrderCreatedEvent, Subjects } from "@gvtickets/common";
import { queueGroupName } from './queue-group-name';
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { OrderStatus } from '@gvtickets/common';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
        const order = Order.build({
            id: data.id,
            price: data.ticket.price,
            status: data.status as OrderStatus,
            userId: data.userId,
            version: data.version
        });

        await order.save();

        msg.ack();
    }
}