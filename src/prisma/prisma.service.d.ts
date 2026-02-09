import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private _invoice;
    get invoice(): any;
    set invoice(value: any);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
