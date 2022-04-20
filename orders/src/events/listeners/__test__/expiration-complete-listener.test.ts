import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { ExpirationCompleteEvent, OrderStatus } from '@gvtickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';
import { Order } from '../../../models/order';

const setup = async () => {
    // create an instance of the listener
    const listener = new ExpirationCompleteListener(natsWrapper.client);
    
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'gig',
        price: 20
    });
    await ticket.save();

    const order = Order.build({
       status: OrderStatus.Created,
       userId: 'ijbib', 
       expiresAt: new Date(),
       ticket
    });
    await order.save();

    // create a fake data event
    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, data, order, ticket, msg };
};

it('updates the order status to cancelled', async () => {
    const { listener, data, order, msg } = await setup();

    // call the onMessage function with the data object plus message object
    await listener.onMessage(data, msg);

    const orderUpdated = await Order.findById(order.id);

    expect(orderUpdated).toBeDefined();
    expect(orderUpdated!.status).toEqual(OrderStatus.Cancelled);
});

it('emits an OrderCancelledEvent', async () => {
    const { listener, data, order, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const eventData = JSON.parse(
       (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
    );

    expect(eventData.id).toEqual(order.id);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    // call the onMessage function with the data object plus message object
    await listener.onMessage(data, msg);

    // write assetion to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});