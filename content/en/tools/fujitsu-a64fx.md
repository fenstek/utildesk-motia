---
slug: fujitsu-a64fx
title: Fujitsu A64FX
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: AI Infrastructure
price_model: Individuelles Angebot
official_url: 'https://global.fujitsu/en-global/capabilities/computer-platform'
description: 'An Arm-based HPC processor with SVE and integrated HBM2 for memory-intensive scientific computing and large-scale clusters.'
updated_at: 2026-07-13
lastReviewed: 2026-07-13
popularity: 0
source_language: de
translation: full
---
# Fujitsu A64FX

The Fujitsu A64FX is a specialised Arm processor for high-performance computing. It combines many CPU cores, Scalable Vector Extension (SVE), and integrated HBM2 memory in one socket. That makes it relevant to scientific simulations, numerical models, and other data-intensive HPC programs, but it is not a general desktop processor, a ready-made cloud service, or an automatically faster replacement for every x86 or GPU application.

## What it is and who should consider it

The processor is aimed at data centres, research organisations, and teams planning their own HPC nodes or a cluster based on them. Fujitsu documents Armv8.2-A with SVE, 48 compute cores, and up to four additional assistant cores. Four HBM2 stacks provide 32 GiB of memory and very high bandwidth. This matters when a workload repeatedly moves large datasets, rather than only needing more arithmetic throughput.

For a team with a stable x86 or GPU pipeline, A64FX is therefore not a drop-in purchase. The decision starts with a porting and benchmarking project: source code, compiler, MPI/OpenMP stack, libraries, and containers all need to be validated on Arm and in the selected system environment.

## Components that matter in practice

- **CPU and SVE:** Vectorisable loops can process multiple data points per instruction. The gain depends on the compiler, data layout, and algorithm, not simply on having SVE.
- **HBM2:** Integrated high-bandwidth memory can reduce the distance to data for suitable workloads. The 32 GiB per processor is also a boundary: larger datasets need distribution across nodes, memory tiers, or I/O.
- **Node and cluster communication:** MPI, process placement, and the interconnect design of the chosen system determine distributed performance. The processor does not provide a cluster strategy on its own.
- **Arm software stack:** Compilers, math libraries, MPI, scheduler, and monitoring need to be versioned as one reproducible stack. Fujitsu documents Arm-specific compiler and HPC environments for this kind of operation.

## A practical adoption workflow

Start with a representative job rather than a synthetic peak number: for example, a weather, fluid, materials, or molecular simulation at a real input size. Measure the current platform first. Then port a small, reproducible path to A64FX and record compiler flags, thread count, MPI ranks, memory use, runtime, and numerical differences.

A useful pilot has three stages. First, compile and validate a serial or small parallel case. Next, scale within one node. Finally, test multiple nodes. A rollout is justified only when result quality, runtime, energy or cluster cost, and maintenance effort look better together. A reproducible container or module setup prevents the result from depending on one developer's environment.

## Operations, integration, and maintenance

Production operation includes the scheduler, queues, node health, MPI topology, HBM utilisation, checkpoint and filesystem I/O, and controlled recovery. Long simulations should write checkpoints and resume after a node or filesystem failure where the application supports it. This can reduce the cost of a failed run more effectively than a better isolated microbenchmark.

The system form matters: A64FX is used in specialised HPC systems, not as an interchangeable CPU for any office server. Before procurement, clarify cooling, rack and power planning, spare-parts and support arrangements, compiler or software support, and library availability. For cloud use, verify the exact provider and instance availability; the processor name alone does not imply a general public-cloud offer.

## Quality, porting, and decision metrics

A fast run is successful only when the scientific result is identical within an agreed tolerance or any difference is explained. Define reference data, deterministic test cases, acceptance thresholds, and an owner for review. Check scaling as well: an application that wins on one node can lose at cluster scale because of MPI communication, I/O, or an unbalanced partition.

The useful signals are time to a completed result, memory-bandwidth behaviour in the real workload, parallel scaling, utilisation, energy and infrastructure cost, and the effort required for porting and operations. AI-related work such as vector, half-precision, or integer dot-product calculations may benefit, but that does not make A64FX equivalent to a GPU or a dedicated AI accelerator.

## Security, data, and governance

A64FX is hardware, not a SaaS service that automatically defines data processing, retention, or access. Those controls belong in the HPC environment: separate accounts and projects, scheduler permissions, network segmentation, trusted images and modules, patch and firmware processes, controlled or encrypted filesystems, and documented retention and deletion rules.

For research or customer data, settle classification, export restrictions, data-centre location, backups, and access logging before the first production job. Simulation results also need provenance: code version, compiler, input data, parameters, and checkpoint should be traceable. That supports scientific reproducibility as well as internal review and release decisions.

## Pricing and total cost

There is no reliable single retail price for A64FX in this card's context. Costs typically arrive as a system or cluster quotation covering nodes and memory, networking and racks, cooling, installation, support, software environment, electricity, storage and backup, and porting of existing applications. Comparing only the processor price would be misleading.

Ask for a quotation based on the actual node count and workload. Compare not only purchase price and delivery scope, but also cost per completed job, maintenance windows, recovery from failed runs, and developer time spent on Arm optimisation.

## Editorial Assessment

A64FX is recommended for HPC teams with a clear, parallelisable, memory-bandwidth-heavy workload, operational ownership, and the capacity to port software to Arm. It creates value when a representative end-to-end job completes measurably faster, more efficiently, or more economically and the stack can be operated reproducibly.

For small teams without HPC operations, ordinary server software, or AI projects that primarily depend on CUDA and GPU tensor acceleration, a more focused CPU or accelerator alternative is often the better choice. Select A64FX using real end-to-end results, not marketing peak numbers.

<figure class="tool-editorial-figure">
  <img src="/images/tools/fujitsu-a64fx-editorial.webp" alt="HPC node with a densely packed processor and memory module in a scientific data centre" loading="lazy" decoding="async" />
</figure>

## Alternatives

- [NVIDIA A100 Tensor Core GPU](/en/tools/nvidia-a100-tensor-core-gpu/): Better suited when training and inference with GPU-optimised frameworks and Tensor Cores is the main requirement.
- [AMD Instinct GPU](/en/tools/amd-instinct-gpu/): A GPU family for teams evaluating high parallelism and an alternative accelerator ecosystem.
- [Intel Habana Labs Gaudi](/en/tools/intel-habana-labs-gaudi/): More focused on dedicated deep-learning workloads than on general CPU-based HPC simulation.
- [Graphcore IPU](/en/tools/graphcore-ipu/): A more specialised architecture for graph and AI workloads, with a different software and porting decision.
- [NVIDIA Tensor Core GPUs](/en/tools/nvidia-tensor-core-gpus/): A broader GPU option when many established AI frameworks and model implementations should be available.

## FAQ

**When should I choose A64FX over a GPU?**

Choose it when the workload is well expressed as CPU HPC code using MPI, OpenMP, and vectorisable numerical loops, and benefits from high memory bandwidth. For tensor-heavy or GPU-optimised deep learning, run a GPU comparison in the same pilot first.

**Can existing x86 programs run unchanged?**

Not reliably. Portability depends on source code, binary dependencies, compiler, libraries, and the container base. Plan an Arm validation and check numerical results and performance, not only whether the build succeeds.

**Is A64FX a ready-made cloud service?**

No. It is a processor used in specialised systems and selected HPC offerings. Availability, access, billing, and support must be checked with the specific system or cloud provider.

**How should a purchase be compared?**

Compare one complete, reproducible job: result quality, time to result, scaling, memory and I/O behaviour, energy or system cost, and porting effort. A peak-FLOPS figure alone is not sufficient.
